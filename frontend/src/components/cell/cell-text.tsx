import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { Dropdown } from '@/components/dropdown';
import { Input } from '@/components/input';
import { Tooltip } from '@/components/tooltip';
import { Cell } from '@/stores/device';
import { copyToClipboard } from '@/utils/clipboard';
import { CellHistory } from './cell-history';
import './styles.css';

export const CellText = observer(({ cell }: { cell: Cell }) => {
  const { t } = useTranslation();

  return (
    <div className="deviceCell-textWrapper">
      <CellHistory cell={cell} />

      {cell.value && cell.readOnly && (
        <Tooltip
          text={<span><b>'{cell.value}'</b> {t('widgets.labels.copy')}</span>}
          placement="top-end"
          trigger="click"
        >
          <div className="deviceCell-text" onClick={() => copyToClipboard(cell.value as string)}>
            {cell.getEnumName(cell.value as string)}
          </div>
        </Tooltip>
      )}
      {(!cell.readOnly && cell.isEnum) && (
        <Dropdown
          className="deviceCell-select"
          size="small"
          options={cell.enumValues.map(({ name, value }) => ({ label: name, value }))}
          value={cell.value as string | number}
          onChange={(option) => cell.value = option.value}
        />
      )}
      {(!cell.readOnly && !cell.isEnum) && (
        <Input
          id={cell.id}
          value={cell.value as string}
          isDisabled={cell.readOnly}
          size="small"
          ariaLabel={cell.name}
          isWithExplicitChanges
          onChange={(value) => cell.value = value}
        />
      )}
    </div>
  );
});
