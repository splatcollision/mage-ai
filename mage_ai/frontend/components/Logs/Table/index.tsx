import Ansi from 'ansi-to-react';
import NextLink from 'next/link';
import { FixedSizeList } from 'react-window';
import { useCallback } from 'react';

import BlockType from '@interfaces/BlockType';
import Circle from '@oracle/elements/Circle';
import Flex from '@oracle/components/Flex';
import FlexContainer from '@oracle/components/FlexContainer';
import Link from '@oracle/elements/Link';
import LogType from '@interfaces/LogType';
import PipelineType, { PipelineTypeEnum } from '@interfaces/PipelineType';
import Spacing from '@oracle/elements/Spacing';
import Text from '@oracle/elements/Text';

import { ChevronRight } from '@oracle/icons';
import { FilterQueryType } from '@components/Logs/Filter';
import { HEADER_HEIGHT } from '@components/shared/Header/index.style';
import { LogLevelIndicatorStyle } from '@components/Logs/index.style';
import { TableContainer, TableHeadStyle, TableRowStyle } from './index.style';
import { ThemeType } from '@oracle/styles/themes/constants';
import { UNIT } from '@oracle/styles/units/spacing';
import { WIDTH_OF_SINGLE_CHARACTER_MONOSPACE } from '@components/DataTable';
import { formatTimestamp } from '@utils/models/log';
import { getColorsForBlockType } from '@components/CodeBlock/index.style';
import { goToWithQuery } from '@utils/routing';
import { useWindowSize } from '@utils/sizes';

export const LOG_UUID_PARAM = 'log_uuid';

type LogsTableProps = {
  blocksByUUID: { [keyof: string]: BlockType };
  logs: LogType[];
  pipeline: PipelineType;
  query: FilterQueryType;
  setSelectedLog: (log: LogType) => void;
  themeContext: ThemeType;
};

function LogsTable({
  blocksByUUID,
  logs,
  pipeline,
  query,
  setSelectedLog,
  themeContext,
}: LogsTableProps) {
  const { height: windowHeight } = useWindowSize();
  const maxBlockUUIDLength = Math.max(...Object.keys(blocksByUUID || {}).map(k => k.length));
  const blockUUIDColWidth = (maxBlockUUIDLength * WIDTH_OF_SINGLE_CHARACTER_MONOSPACE)
    + 12 + 8;  // add block color square and spacing
  const columns = [
    {
      uuid: '_',
      width: 28,
    },
    {
      uuid: 'Date',
      width: 214,
    },
    {
      uuid: 'Block',
      width: blockUUIDColWidth + 16,
    },
    {
      uuid: 'Message',
    },
    {
      uuid: '_',
    },
  ];

  const renderRow = useCallback(({ data, index, style }) => {
    const {
      blocksByUUID,
      logs,
      pipeline,
      themeContext,
    } = data;
    const { content, data: logData, name } = logs[index];
    const {
      block_uuid: blockUUIDProp,
      level,
      message,
      pipeline_uuid: pipelineUUID,
      timestamp,
      uuid,
    } = logData || {};

    let idEl;
    let blockUUID = blockUUIDProp || name.split('.log')[0];

    let streamID;
    let streamIndex;
    const parts = blockUUID.split(':');
    if (PipelineTypeEnum.INTEGRATION === pipeline.type) {
      blockUUID = parts[0];
      streamID = parts[1];
      streamIndex = parts[2];
    }

    let block = blocksByUUID[blockUUID];
    if (!block) {
      block = blocksByUUID[parts[0]];
    }

    if (block) {
      const color = getColorsForBlockType(
        block.type,
        { blockColor: block.color, theme: themeContext },
      ).accent;

      idEl = (
        <FlexContainer alignItems="center">
          <NextLink
            as={`/pipelines/${pipelineUUID}/edit?block_uuid=${blockUUID}`}
            href="/pipelines/[pipeline]/edit"
            passHref
          >
            <Link
              block
              fullWidth
              sameColorAsText
              verticalAlignContent
            >
              <Circle
                color={color}
                size={UNIT * 1.5}
                square
              />

              <Spacing mr={1} />

              <Text disableWordBreak monospace>
                {blockUUID}{streamID && ': '}{streamID && (
                  <Text default inline monospace>
                    {streamID}
                  </Text>
                )}{streamIndex >= 0 && ': '}{streamIndex >= 0 && (
                  <Text default inline monospace>
                    {index}
                  </Text>
                )}
              </Text>
            </Link>
          </NextLink>
        </FlexContainer>
      );
    }

    return (
      <TableRowStyle
        className="table_row"
        onClick={() => {
          const log = logs[index];
          let logUUID = log.data?.uuid;

          if (query[LOG_UUID_PARAM] === logUUID) {
            logUUID = null;
          }

          goToWithQuery({ [LOG_UUID_PARAM]: logUUID });
          setSelectedLog(logUUID ? log : null);
        }}
        selected={query?.[LOG_UUID_PARAM] && query?.[LOG_UUID_PARAM] === uuid}
        style={{
          ...style,
        }}
      >
        <Flex
          alignItems="center"
          justifyContent="center"
          key="log_type"
        >
          <LogLevelIndicatorStyle {...{ [level?.toLowerCase()]: true }} />
        </Flex>
        <Flex>
          <Text
            default
            key="log_timestamp"
            monospace
            noWrapping
          >
            {formatTimestamp(timestamp)}
          </Text>
        </Flex>
        <Flex style={{ minWidth: blockUUIDColWidth }}>
          {idEl}
        </Flex>
        <Flex
          style={{
            overflow: 'auto',
          }}>
          <Text
            key="log_message"
            monospace
            textOverflow
            title={message || content}
          >
            <Ansi>
              {message || content}
            </Ansi>
          </Text>
        </Flex>
        <Flex
          flex="1"
          justifyContent="flex-end"
          key="chevron_right_icon"
        >
          <ChevronRight default size={2 * UNIT} />
        </Flex>
      </TableRowStyle>
    );
  }, [blockUUIDColWidth, query, setSelectedLog]);

  return (
    <TableContainer>
      <TableHeadStyle>
        {columns.map((col, idx) => (
          <Flex
            alignItems="center"
            key={`${col}_${idx}`}
            style={{
              height: UNIT * 4,
              minWidth: col.width || null,
            }}
          >
            {col.uuid !== '_' &&
              <Text
                bold
                leftAligned
                monospace
                muted
              >
                {col.uuid}
              </Text>
            }
          </Flex>
        ))}
      </TableHeadStyle>
      <FixedSizeList
        // window height - header - subheader - table header - footer
        height={windowHeight - HEADER_HEIGHT - 86 - 34 - 58}
        itemCount={logs.length}
        itemData={{
          blocksByUUID,
          logs,
          pipeline,
          themeContext,
        }}
        itemSize={UNIT * 3.75}
        width="100%"
      >
        {renderRow}
      </FixedSizeList>
    </TableContainer>
  );
}

export default LogsTable;
