import React from 'react';
import { Button, ErrorBar } from '../../common';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import JsonEditor from '../../components/json-editor/jsonEditor';
import { useMediaQuery } from 'react-responsive';

const CollapseButton = observer(({ hasChildren, collapsed, onCollapse, onRestore }) => {
  const isMobile = useMediaQuery({ maxWidth: 991 });
  if (!hasChildren) {
    return null;
  }

  return (
    <i
      className={
        collapsed ? 'glyphicon glyphicon-chevron-right' : 'glyphicon glyphicon-chevron-down'
      }
      onClick={e => {
        // Block selection of a tab after clicking on button
        if (isMobile) {
          e.stopPropagation();
        }
        collapsed ? onRestore() : onCollapse();
      }}
    ></i>
  );
});

export const PortTab = observer(({ tab }) => {
  return (
    <div className={'port-tab' + (tab.hasInvalidConfig ? ' error' : '')}>
      <CollapseButton
        hasChildren={tab.hasChildren}
        collapsed={tab.collapsed}
        onCollapse={tab.collapse}
        onRestore={tab.restore}
      />
      <span>{tab.name}</span>
      {tab.hasInvalidConfig && <i className="glyphicon glyphicon-exclamation-sign"></i>}
    </div>
  );
});

export const PortTabContent = ({ tab, index, onDeleteTab }) => {
  const { t } = useTranslation();
  return (
    <div>
      {tab.childrenHasInvalidConfig && <ErrorBar msg={t('device-manager.errors.device-config')} />}
      <div className="port-tab-content-header">
        <span>{tab.title}</span>
        <Button
          key="delete"
          label={t('device-manager.buttons.delete')}
          type="danger"
          onClick={onDeleteTab}
        />
      </div>
      <JsonEditor
        schema={tab.schema}
        data={tab.editedData}
        root={'port' + index}
        onChange={tab.setData}
      />
    </div>
  );
};
