import { useThreadsContext } from "@/components/agent-inbox/contexts/ThreadContext";
import { InboxItem } from "./components/inbox-item";
import React from "react";
import { useQueryParams } from "./hooks/use-query-params";
import { AGENT_INBOX_PARAM, INBOX_PARAM, LIMIT_PARAM, OFFSET_PARAM, START_VIEW_PARAM_VALUE } from "./constants";
import { ThreadStatusWithAll } from "./types";
import { Pagination } from "./components/pagination";
import { Inbox as InboxIcon, LoaderCircle } from "lucide-react";
import { InboxButtons } from "./components/inbox-buttons";
import { AgentTriggerForm } from "./components/agent-trigger-form";
import { InputSchemaField } from "./contexts/ThreadContext";
import { cn } from "@/lib/utils";

interface AgentConfig {
  id: string;
  name: string;
  graphId: string;
  inputSchema: InputSchemaField[];
}

export function AgentInboxView<
  ThreadValues extends Record<string, any> = Record<string, any>,
>() {
  const { searchParams, updateQueryParams, getSearchParam } = useQueryParams();
  const { loading, threadData, agentInboxes } = useThreadsContext<ThreadValues>();
  
  // Get the current agent config from the context
  const currentAgentId = getSearchParam(AGENT_INBOX_PARAM);
  const currentAgent = agentInboxes.find(agent => agent.id === currentAgentId);
  
  // Create agent config for the form
  const agentConfig: AgentConfig | null = currentAgent ? {
    id: currentAgent.id,
    name: currentAgent.name || currentAgent.graphId,
    graphId: currentAgent.graphId,
    inputSchema: [
      { 
        name: 'input_prompt', 
        label: 'Input', 
        type: 'textarea' as const, 
        required: true,
        rows: 5,
        placeholder: 'Enter your input for the agent...',
        description: 'Provide instructions or data for the agent to process in this run.'
      }
    ]
  } : null;
  const selectedInbox = (getSearchParam(INBOX_PARAM) ||
    "interrupted") as ThreadStatusWithAll | typeof START_VIEW_PARAM_VALUE;
  
  const isStartView = selectedInbox === START_VIEW_PARAM_VALUE;

  const changeInbox = async (inbox: ThreadStatusWithAll | typeof START_VIEW_PARAM_VALUE) => {
    const paramsToUpdate: string[] = [INBOX_PARAM];
    const valuesToUpdate: string[] = [inbox];

    if (inbox !== START_VIEW_PARAM_VALUE) {
      paramsToUpdate.push(OFFSET_PARAM, LIMIT_PARAM);
      valuesToUpdate.push("0", "10");
    } else {
      // When switching TO start view, remove pagination params
      paramsToUpdate.push(OFFSET_PARAM, LIMIT_PARAM);
      valuesToUpdate.push(undefined as any, undefined as any); // Undefined value removes the param
    }
    updateQueryParams(paramsToUpdate, valuesToUpdate);
  };

  React.useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const offsetQueryParam = getSearchParam(OFFSET_PARAM);
      const limitQueryParam = getSearchParam(LIMIT_PARAM);
      if (!offsetQueryParam) {
        updateQueryParams(OFFSET_PARAM, "0");
      }
      if (!limitQueryParam) {
        updateQueryParams(LIMIT_PARAM, "10");
      }
    } catch (e) {
      console.error("Error updating query params", e);
    }
  }, [searchParams]);

  const threadDataToRender = React.useMemo(
    () =>
      threadData.filter((t) => {
        if (selectedInbox === "all") return true;
        return t.status === selectedInbox;
      }),
    [selectedInbox, threadData]
  );
  const noThreadsFound = !threadDataToRender.length;

  return (
    <div className="min-w-[1000px] h-full overflow-y-auto">
      {!isStartView && (
        <div className="pl-5 pt-4">
          <InboxButtons changeInbox={changeInbox} />
        </div>
      )}
      
      {isStartView ? (
        <div className="p-6">
          <div className="w-full flex flex-col items-start justify-start gap-2">
            <div className="flex flex-col gap-4 items-start w-full p-6 rounded-lg border border-gray-300 bg-white">
              <AgentTriggerForm agentConfig={agentConfig} changeInbox={changeInbox} />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-start w-full max-h-fit h-full border-y-[1px] border-gray-50 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 mt-3">
            {threadDataToRender.map((threadData, idx) => {
              return (
                <InboxItem<ThreadValues>
                  key={`inbox-item-${threadData.thread.thread_id}`}
                  threadData={threadData}
                  isLast={idx === threadDataToRender.length - 1}
                />
              );
            })}
            {noThreadsFound && !loading && (
              <div className="w-full flex items-center justify-center p-4">
                <div className="flex gap-2 items-center justify-center text-gray-700">
                  <InboxIcon className="w-6 h-6" />
                  <p className="font-medium">No threads found</p>
                </div>
              </div>
            )}
            {noThreadsFound && loading && (
              <div className="w-full flex items-center justify-center p-4">
                <div className="flex gap-2 items-center justify-center text-gray-700">
                  <p className="font-medium">Loading</p>
                  <LoaderCircle className="w-6 h-6 animate-spin" />
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-start w-full p-5">
            <Pagination />
          </div>
        </>
      )}
    </div>
  );
}
