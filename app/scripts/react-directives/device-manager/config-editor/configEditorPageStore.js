'use strict';

import { makeObservable, observable, computed } from 'mobx';
import cloneDeep from 'lodash/cloneDeep';
import i18n from '../../../i18n/react/config';
import SelectModalState from '../../components/modals/selectModalState';
import { getDefaultObject } from './jsonSchemaUtils';
import AccessLevelStore from '../../components/access-level/accessLevelStore';
import PageWrapperStore from '../../components/page-wrapper/pageWrapperStore';
import ConfirmModalState from '../../components/modals/confirmModalState';
import AddDeviceModalState from './addDeviceModalState';
import { TabsStore } from './tabsStore';
import { DeviceTab } from './deviceTabStore';
import {
  PortTab,
  makeModbusTcpPortTabName,
  makeSerialPortTabName,
  makeTcpPortTabName,
} from './portTabStore';
import { SettingsTab } from './settingsTabStore';
import { getTranslation } from './jsonSchemaUtils';

const CONFED_WRITE_FILE_ERROR = 1002;

function getPortSchemaCommon(schema, subSchemaName) {
  let res = cloneDeep(schema.definitions[subSchemaName]);
  res.definitions = {};
  Object.entries(schema.definitions).forEach(([key, value]) => {
    if (key != subSchemaName) {
      res.definitions[key] = value;
    }
  });
  res.translations = schema.translations;
  return res;
}

function getSerialPortSchema(schema) {
  return getPortSchemaCommon(schema, 'serialPort');
}

function getTcpPortSchema(schema) {
  return getPortSchemaCommon(schema, 'tcpPort');
}

function getModbusTcpPortSchema(schema) {
  return getPortSchemaCommon(schema, 'modbusTcpPort');
}

function getGeneralSettingsSchema(schema) {
  delete schema.definitions;
  delete schema.properties.ports;
  schema.description = '';
  return schema;
}

function makePortSchemaMap(schema) {
  let res = {};
  res['serial'] = getSerialPortSchema(schema);
  res['tcp'] = getTcpPortSchema(schema);
  res['modbus tcp'] = getModbusTcpPortSchema(schema);
  return res;
}

function getPortData(data) {
  let res = cloneDeep(data);
  delete res.devices;
  return res;
}

function makePortTypeSelectOptions(portSchemaMap) {
  return Object.entries(portSchemaMap).map(([portType, schema]) => {
    return {
      label: getTranslation(schema.title, i18n.language, schema.translations),
      value: portType,
    };
  });
}

function makePortSelectOptions(portTabs) {
  return portTabs.map(tab => {
    return { label: tab.name, value: tab };
  });
}

class ConfigEditorPageStore {
  constructor(loadConfigFn, saveConfigFn, toMobileContent, toTabs, deviceTypesStore, rolesFactory) {
    this.accessLevelStore = new AccessLevelStore(rolesFactory);
    this.accessLevelStore.setRole(rolesFactory.ROLE_TWO);
    this.pageWrapperStore = new PageWrapperStore();
    this.selectModalState = new SelectModalState();
    this.confirmModalState = new ConfirmModalState();
    this.addDeviceModalState = new AddDeviceModalState();
    this.tabs = new TabsStore(toMobileContent, toTabs);
    this.deviceTypesStore = deviceTypesStore;
    this.portSchemaMap = {};
    this.saveConfigFn = saveConfigFn;
    this.loadConfigFn = loadConfigFn;
    this.loaded = false;

    makeObservable(this, {
      allowSave: computed,
      isDirty: computed,
      loaded: observable,
    });
  }

  get isDirty() {
    return this.tabs.isDirty;
  }

  get allowSave() {
    return this.isDirty && !this.tabs.hasInvalidConfig;
  }

  createPortTab(portConfig) {
    if (portConfig.port_type == 'serial' || portConfig.port_type === undefined) {
      return new PortTab(
        getPortData(portConfig),
        this.portSchemaMap['serial'],
        makeSerialPortTabName
      );
    }
    if (portConfig.port_type == 'tcp') {
      return new PortTab(getPortData(portConfig), this.portSchemaMap['tcp'], makeTcpPortTabName);
    }
    if (portConfig.port_type == 'modbus tcp') {
      return new PortTab(
        getPortData(portConfig),
        this.portSchemaMap['modbus tcp'],
        makeModbusTcpPortTabName
      );
    }
    return undefined;
  }

  createDeviceTab(deviceConfig) {
    const deviceType = deviceConfig?.device_type || deviceConfig?.protocol || 'modbus';
    return new DeviceTab(deviceConfig, deviceType, this.deviceTypesStore);
  }

  createSettingsTab(config, schema) {
    delete config.ports;
    return new SettingsTab(config, getGeneralSettingsSchema(schema));
  }

  async load() {
    try {
      this.loaded = false;
      this.pageWrapperStore.clearError();
      const { config, schema, deviceTypeGroups } = await this.loadConfigFn();
      this.deviceTypesStore.setDeviceTypeGroups(deviceTypeGroups);
      this.portSchemaMap = makePortSchemaMap(schema);
      config?.ports?.forEach(port => {
        const portTab = this.createPortTab(port);
        if (portTab === undefined) {
          return;
        }
        if (port?.devices) {
          port.devices.forEach(device => {
            portTab.addChildren(this.createDeviceTab(device));
          });
        }
        this.tabs.addPortTab(portTab, true);
      });
      this.tabs.addSettingsTab(this.createSettingsTab(config, schema));
      this.loaded = true;
    } catch (err) {
      this.tabs.clear();
      this.setError(err);
      this.loaded = false;
    }
    this.pageWrapperStore.setLoading(false);
  }

  setError(error) {
    if (typeof error === 'object') {
      if (error.hasOwnProperty('code')) {
        this.pageWrapperStore.setError(`${error.message}: ${error.data}(${error.code})`);
      } else {
        this.pageWrapperStore.setError(error.message);
      }
      return;
    }
    this.pageWrapperStore.setError(error);
  }

  async addPort() {
    let newPortType;
    try {
      newPortType = await this.selectModalState.show(
        i18n.t('device-manager.buttons.add-port'),
        i18n.t('device-manager.buttons.add-port'),
        makePortTypeSelectOptions(this.portSchemaMap)
      );
    } catch (err) {
      if (err == 'cancel') {
        return;
      }
    }
    let tab = this.createPortTab(getDefaultObject(this.portSchemaMap[newPortType]));
    this.tabs.addPortTab(tab);
  }

  async showDeleteConfirmModal() {
    return this.confirmModalState.show(
      i18n.t('device-manager.labels.confirm-delete', {
        item: this.tabs.selectedTab?.name,
        interpolation: { escapeValue: false },
      }),
      [
        {
          label: i18n.t('device-manager.buttons.delete'),
          type: 'danger',
        },
      ]
    );
  }

  async deleteTab() {
    if ((await this.showDeleteConfirmModal()) == 'ok') {
      this.tabs.deleteSelectedTab();
    }
  }

  async addDevice() {
    let newDeviceType;
    let portTab;
    try {
      [portTab, newDeviceType] = await this.addDeviceModalState.show(
        makePortSelectOptions(this.tabs.portTabs),
        this.deviceTypesStore.deviceTypeSelectOptions,
        this.tabs.selectedPortTab
      );
    } catch (err) {
      if (err == 'cancel') {
        return;
      }
      throw err;
    }
    let deviceTab = new DeviceTab({}, newDeviceType, this.deviceTypesStore);
    this.tabs.addDeviceTab(portTab, deviceTab);
    deviceTab.setDefaultData();
  }

  makeConfigJson() {
    let config = cloneDeep(this.tabs.items[this.tabs.items.length - 1].editedData);
    this.tabs.portTabs.forEach(portTab => {
      config.ports ??= [];
      let portConfig = cloneDeep(portTab.editedData);
      portConfig.devices ??= [];
      portTab.children.forEach(deviceTab => {
        portConfig.devices.push(cloneDeep(deviceTab.editedData));
      });
      config.ports.push(portConfig);
    });
    return config;
  }

  async save() {
    this.pageWrapperStore.setLoading(true);
    this.pageWrapperStore.clearError();
    try {
      await this.saveConfigFn(this.makeConfigJson());
      this.tabs.commitData();
    } catch (err) {
      if (err.data === 'EditorError' && err.code === CONFED_WRITE_FILE_ERROR) {
        this.pageWrapperStore.setError(i18n.t('device-manager.errors.write'));
      } else {
        this.pageWrapperStore.setError(err.message);
      }
    }
    this.pageWrapperStore.setLoading(false);
  }

  changeDeviceType(tab, type) {
    tab.setDeviceType(type);
  }

  async addDevices(devices) {
    try {
      this.pageWrapperStore.setLoading(true);
      let added = false;
      this.loaded = false;
      this.pageWrapperStore.clearError();
      await Promise.all(
        devices.map(async device => {
          if (!device.type) {
            return;
          }
          let portTab = this.tabs.portTabs.find(p => p.editedData?.path == device.port);
          if (!portTab) {
            return;
          }
          let deviceConfig = getDefaultObject(await this.deviceTypesStore.getSchema(device.type));
          deviceConfig.slave_id = String(device.cfg.slave_id);
          this.tabs.addDeviceTab(portTab, this.createDeviceTab(deviceConfig), true);
          added = true;
        })
      );

      if (added) {
        this.tabs.setModifiedStructure();
      }
      this.loaded = true;
    } catch (err) {
      this.setError(err);
      this.loaded = false;
    }
    this.pageWrapperStore.setLoading(false);
  }

  setDeviceDisconnected(topic, error) {
    const tab = this.tabs.findDeviceTabByTopic(topic);
    tab?.setDisconnected(error == 'r');
  }
}

export default ConfigEditorPageStore;
