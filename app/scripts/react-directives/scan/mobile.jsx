import React from 'react';
import { useTranslation } from 'react-i18next';
import { WarningTag, ErrorTag, FirmwareVersionWithLabels } from './common';

function Tags({bootloader_mode, online, poll}) {
  const { t } = useTranslation();
  return (
    <div className='pull-right'>
        {bootloader_mode && <ErrorTag text={t("device-manager.labels.in-bootloder")}/>}
        {!online && <ErrorTag text={t("device-manager.labels.offline")}/>}
        {!poll && <WarningTag text={t("device-manager.labels.not-polled")}/>}
    </div>
  );
}

function DeviceName(props) {
  const { t } = useTranslation();
  const errorId = "com.wb.device_manager.device.read_device_signature_error";
  const error = props.errors?.find(e => e.id === errorId);
  if (error) {
    return (
      <div className='row'>
        <div className='col-xs-12'>
          <ErrorTag text={t("com.wb.device_manager.error")}/>
        </div>
      </div>
    );
  }
  return ( 
    <div className='row'>
      <div className='col-xs-12'>
        <div className='pull-left'>
            <b>{props.title}</b>
        </div>
        <Tags bootloader_mode={props.bootloader_mode} online={props.online} poll={props.poll} />
      </div>
    </div>
  );
}

function Row({title, children}) {
  return (
    <div className='row'>
      <div className='col-xs-3'>{title}</div>
      <div className='col-xs-9'>{children}</div>
    </div>
  );
}

function SlaveId({slaveId, isDuplicate}) {
  const { t } = useTranslation();
  return (
    <Row title={t('device-manager.labels.address')}>
      {slaveId} {isDuplicate && <ErrorTag text={t('device-manager.labels.duplicate')}/>}
    </Row>
  );
}

function SerialNumber({sn}) {
  return <Row title='SN'>{sn}</Row>;
}

function Port({path, baud_rate, data_bits, parity, stop_bits}) {
  const { t } = useTranslation();
  return  (
    <Row title={t('device-manager.labels.port')}>
      {path} {baud_rate} {data_bits.toString()}{parity}{stop_bits.toString()}
    </Row>
  );
}

function Firmware(props) {
  const { t } = useTranslation();
  const errorId = "com.wb.device_manager.device.read_fw_version_error";
  const error = props.errors.find(e => e.id === errorId);
  if (error) {
    return (
      <Row title={t('device-manager.labels.firmware')}>
        <ErrorTag text={t("com.wb.device_manager.error")}/>
      </Row>
    );
  }
  return (
    <Row title={t('device-manager.labels.firmware')}>
      <FirmwareVersionWithLabels version={props.fw?.version} availableFw={props.fw?.update?.available_fw} extSupport={props.fw?.ext_support}/>
    </Row>
  );
}

function Error({error}) {
  return (
    <div className='row'>
      <div className='col-xs-12'>
        <div className='tag bg-danger error'>
          {error}
        </div>
      </div>
    </div>
  );
}

function DevicePanel(props) {
    var error;
    if (props.fw && props.fw.update)
      error = props.fw.update.error;
    return (
      <div key={props.uuid} className='panel panel-default'>
        <div className='panel-body'>
          <DeviceName {...props} />
          <SerialNumber sn={props.sn} />
          <SlaveId slaveId={props.cfg.slave_id} isDuplicate={props.slave_id_collision}></SlaveId>
          <Port path={props.port.path} baud_rate={props.cfg.baud_rate} data_bits={props.cfg.data_bits} parity={props.cfg.parity} stop_bits={props.cfg.stop_bits} />
          <Firmware {...props} />
          {error && <Error error={error}/>}
        </div>
      </div>
    );
}

function DevicesList({devices}) {
    const rows = devices.map((d) => DevicePanel(d));
    return (
      <>
        {rows}
      </>
    );
}

export default DevicesList;