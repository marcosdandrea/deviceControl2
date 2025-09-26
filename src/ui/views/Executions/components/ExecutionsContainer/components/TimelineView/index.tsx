import React, { useContext, useEffect, useState } from "react";
import style from "./style.module.css";
import { executionContext } from "@views/Executions";
import useExecutions from "@views/Executions/hooks/useExecutions";
import { ConfigProvider, Timeline } from "antd";
import {
  Execution,
  ExecutionLog,
  LogEntry,
} from "@common/types/execution.type";
import Text from "@components/Text";

type TimelineLogItem = LogEntry & {
  ms: string;
  source: string;
  type: "routine" | "task";
};

const LogItem = (log: LogEntry) => {};

const TimelineView = () => {
  const { selectedRoutineId, selectedExecutionId } = useContext(executionContext);
  const { executionData } = useExecutions( selectedRoutineId, selectedExecutionId) as unknown as { executionData: Execution | null };
  const [timelineData, setTimelineData] = useState<null | any[]>(null);

  useEffect(() => {
    if (!executionData || Object.keys(executionData).length === 0) {
      setTimelineData(null);
      return;
    }

    let execution = [];

    execution.push({
      color: "green",
      label: new Date(executionData.triggeredBy.ts).toLocaleString(),
      children: `Rutina iniciada por "${executionData.triggeredBy.name}"`,
    });

    let logs: TimelineLogItem[] = [];
    //recorrer executionData.log.entries y agregar a logs, incluyendo sub-entries
    const processLogEntry = (entry: ExecutionLog) => {
      logs = logs.concat(
        entry.logs.map((log) => ({
          ...log,
          source: entry.name,
          type: entry.type,
          ms: String(new Date(log.ts).getMilliseconds()).padStart(3, "0"),
        }))
      );
      if (entry.children && entry.children.length > 0) {
        entry.children.forEach((child) => processLogEntry(child));
      }
    };

    processLogEntry(executionData.log);
    logs.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());

    const timelineDataRaw = {};

    logs.forEach((log) => {
      const logDate = new Date(log.ts);
      const truncatedDate = new Date(
        logDate.getFullYear(),
        logDate.getMonth(),
        logDate.getDate(),
        logDate.getHours(),
        logDate.getMinutes(),
        logDate.getSeconds(),
        0
      );
      log.ts = truncatedDate.toISOString();
      const { ts, ...rest } = log;
      if (timelineDataRaw[ts]) {
        timelineDataRaw[ts].push(rest);
      } else {
        timelineDataRaw[ts] = [rest];
      }
    });

    //elimina los duplicados de logs
    Object.keys(timelineDataRaw).forEach((ts) => {
      const uniqueLogs = Array.from(
        new Set(timelineDataRaw[ts].map((log: TimelineLogItem) => JSON.stringify(log)))
      ).map((logStr: string) => JSON.parse(logStr));
      timelineDataRaw[ts] = uniqueLogs;
    });

    const timelineData = Object.keys(timelineDataRaw).map((ts) => {
      const date = new Date(ts);
      const truncatedDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        0
      );
      return {
        color: timelineDataRaw[ts].some(
          (log: TimelineLogItem) => log.level === "error"
        )
          ? "var(--error)"
          : timelineDataRaw[ts].some((log: TimelineLogItem) => log.level === "warn")
          ? "var(--warning)"
          : "var(--success)",
        label: truncatedDate.toLocaleString(),
        children: (
          <div className={style.logEntryTsGroup} title={new Date(ts).toLocaleString()}>
            {timelineDataRaw[ts].map((log: TimelineLogItem, index: number) => (
              <div key={index} className={style.logEntry}>
                <div className={style.logEntryInner}>
                  <div className={style.logMS}>{log.ms}</div>
                  <div
                    className={style.dot}
                    style={{
                      backgroundColor:
                        log.level === "info"
                          ? "var(--info)"
                          : log.level === "warn"
                          ? "var(--warning)"
                          : "var(--error)",
                    }}
                  ></div>
                  <div
                    className={style.logTag}
                    style={{
                      backgroundColor:
                        log.type === "routine"
                          ? "var(--routine)"
                          : log.type === "task"
                          ? "var(--task)"
                          : "var(--trigger)",
                    }}
                  >
                    <Text
                      style={{ textTransform: "uppercase" }}
                      fontFamily="Open Sans bold"
                      color="var(--white)"
                      size={12}
                    >
                      {log.source}
                    </Text>
                  </div>
                </div>
                <div className={style.logContent}>{log.message}</div>
              </div>
            ))}
          </div>
        ),
      };
    });

    setTimelineData(timelineData);
  }, [executionData]);

  if (!timelineData)
    return (
      <div className={style.noContent}>
        <p>No hay datos disponibles para mostrar en la línea de tiempo.</p>
      </div>
    );

  return (
    <ConfigProvider
      theme={{
        components: {
          Timeline: {
            itemPaddingBottom: 20,
          },
        },
      }}
    >
      {" "}
      <div className={style.timelineView}>
        <div className={style.timelineContainer}>
          <Timeline
            
            mode="left"
            items={timelineData}
            className={style.timeline}
          />
        </div>
      </div>
    </ConfigProvider>
  );
};

export default TimelineView;
