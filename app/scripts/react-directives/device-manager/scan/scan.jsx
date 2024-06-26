import React from 'react';
import { observer } from 'mobx-react-lite';
import { useMediaQuery } from 'react-responsive';
import DevicesTable from './desktop';
import DevicesList from './mobile';
import { Trans, useTranslation } from 'react-i18next';
import { ScanState } from './scanPageStore';
import { Spinner, ErrorBar, Button } from '../../common';

const InfoMessage = ({ msg }) => {
  if (!msg) {
    return null;
  }
  return (
    <p className="text-center">
      <strong className="text-center">
        <Trans>{msg}</Trans>
      </strong>
    </p>
  );
};

const ToConfigButton = ({ onClick, actualState, hasDevices }) => {
  const { t } = useTranslation();
  const scanInProgress = actualState == ScanState.Started;
  return (
    <Button
      type={'success'}
      label={t('scan.buttons.to-serial')}
      onClick={onClick}
      disabled={scanInProgress || !hasDevices}
    />
  );
};

const Header = ({ actualState, onUpdateSerialConfig, hasDevices, onCancel }) => {
  const { t } = useTranslation();
  return (
    <h1 className="page-header">
      <span>{t('scan.title')}</span>
      <div className="pull-right button-group">
        <ToConfigButton
          onClick={onUpdateSerialConfig}
          actualState={actualState}
          hasDevices={hasDevices}
        />
        <Button label={t('scan.buttons.cancel')} onClick={onCancel} />
      </div>
    </h1>
  );
};

const ScanProgressBar = observer(({ progress }) => {
  return (
    <div className="progress">
      <div
        className="progress-bar progress-bar-striped active"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin="0"
        aria-valuemax="100"
        style={{ width: progress + '%' }}
      ></div>
    </div>
  );
});

const ScanningMessage = observer(({ ports, ext }) => {
  const { t } = useTranslation();
  return (
    <InfoMessage
      msg={t(ext ? 'scan.labels.fast-scanning' : 'scan.labels.scanning', {
        ports,
      })}
    />
  );
});

const FastScanProgressPanel = observer(({ scanStore }) => {
  return (
    <div className="bottom-panel">
      <ScanProgressBar progress={scanStore.progress} />
      <ScanningMessage
        ports={scanStore.scanningPorts.join(', ')}
        ext={scanStore.isExtendedScanning}
      />
    </div>
  );
});

const NormalScanProgressPanel = observer(({ scanStore, onStopScanning }) => {
  const { t } = useTranslation();
  return (
    <div className="bottom-panel">
      <ScanProgressBar progress={scanStore.progress} />
      <ScanningMessage
        ports={scanStore.scanningPorts.join(', ')}
        ext={scanStore.isExtendedScanning}
      />
      <Button label={t('scan.buttons.stop')} onClick={onStopScanning} />
    </div>
  );
});

const FastScanResultPanel = ({ onStartScanning }) => {
  const { t } = useTranslation();
  return (
    <div className="bottom-panel">
      <InfoMessage msg={t('scan.labels.try-normal-scan')} />
      <Button label={t('scan.buttons.scan')} onClick={onStartScanning} />
    </div>
  );
};

const BottomPanel = observer(({ scanStore, nothingFound, onStartScanning, onStopScanning }) => {
  const { t } = useTranslation();
  const scanInProgress = scanStore.actualState == ScanState.Started;
  if (scanInProgress) {
    if (scanStore.isExtendedScanning) {
      return <FastScanProgressPanel scanStore={scanStore} />;
    }
    return <NormalScanProgressPanel scanStore={scanStore} onStopScanning={onStopScanning} />;
  }
  if (scanStore.isExtendedScanning) {
    return <FastScanResultPanel onStartScanning={onStartScanning} />;
  }
  if (nothingFound) {
    return <InfoMessage msg={t('scan.labels.not-found')} />;
  }
  return null;
});

const ScanPageBody = observer(({ pageStore, onStartScanning, onStopScanning }) => {
  const isDesktop = useMediaQuery({ minWidth: 874 });
  if (pageStore.mqttStore.waitStartup) {
    return <Spinner />;
  }
  const nothingFound = pageStore.devicesStore.devices.length == 0;
  if (isDesktop) {
    return (
      <>
        {!nothingFound && <DevicesTable devices={pageStore.devicesStore.devices} />}
        <BottomPanel
          scanStore={pageStore.scanStore}
          nothingFound={nothingFound}
          onStartScanning={onStartScanning}
          onStopScanning={onStopScanning}
        />
      </>
    );
  }
  return (
    <div className="mobile-devices-list">
      {!nothingFound && <DevicesList devices={pageStore.devicesStore.devices} />}
      <BottomPanel
        scanStore={pageStore.scanStore}
        nothingFound={nothingFound}
        onStartScanning={onStartScanning}
        onStopScanning={onStopScanning}
      />
    </div>
  );
});

export const ScanPage = observer(({ pageStore, onCancel }) => {
  return (
    <div className="scan-page device-manager-page">
      <ErrorBar msg={pageStore.globalError.error} />
      <Header
        actualState={pageStore.scanStore.actualState}
        onUpdateSerialConfig={() => pageStore.updateSerialConfig()}
        hasDevices={pageStore.devicesStore.devices.length}
        onCancel={onCancel}
      />
      <ScanPageBody
        pageStore={pageStore}
        onStartScanning={() => pageStore.startStandardScanning()}
        onStopScanning={() => pageStore.stopScanning()}
      />
    </div>
  );
});

export default ScanPage;
