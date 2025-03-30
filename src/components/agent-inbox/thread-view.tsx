import { Thread } from "@langchain/langgraph-sdk";
import { StateView, StateViewObject } from "./components/state-view";
import { ThreadActionsView } from "./components/thread-actions-view";
import { useThreadsContext } from "./contexts/ThreadContext";
import { HumanInterrupt, ThreadData } from "./types";
import React from "react";
import { cn } from "@/lib/utils";
import { useQueryParams } from "./hooks/use-query-params";
import { VIEW_STATE_THREAD_QUERY_PARAM } from "./constants";

export function ThreadView<
  ThreadValues extends Record<string, any> = Record<string, any>,
>({ threadId }: { threadId: string }) {
  const { updateQueryParams } = useQueryParams();
  const { threadData: threads, loading } = useThreadsContext<ThreadValues>();
  const [threadData, setThreadData] =
    React.useState<ThreadData<ThreadValues>>();
  const [showDescription, setShowDescription] = React.useState(true);
  const [showState, setShowState] = React.useState(false);
  const [expandAll, setExpandAll] = React.useState(false);
  const showSidePanel = showDescription || showState;

  React.useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if (!threadId || !threads.length || loading) return;
      const selectedThread = threads.find(
        (t) => t.thread.thread_id === threadId
      );
      if (selectedThread) {
        setThreadData(selectedThread);
        return;
      } else {
        // Route the user back to the inbox view.
        updateQueryParams(VIEW_STATE_THREAD_QUERY_PARAM);
      }
    } catch (e) {
      console.error("Error updating query params & setting thread data", e);
    }
  }, [threads, loading, threadId]);

  const handleShowSidePanel = (
    showState: boolean,
    showDescription: boolean
  ) => {
    if (showState && showDescription) {
      console.error("Cannot show both state and description");
      return;
    }
    if (showState) {
      setShowDescription(false);
      setShowState(true);
    } else if (showDescription) {
      setShowState(false);
      setShowDescription(true);
    } else {
      setShowState(false);
      setShowDescription(false);
    }
  };

  if (!threadData) {
    return null;
  }

  // For idle threads, show the state view
  if (threadData.status === "idle") {
    return (
      <div className="flex flex-col w-full h-full">
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateQueryParams(VIEW_STATE_THREAD_QUERY_PARAM)}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-600"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold">Final Thread State</h2>
            <button
              onClick={() => setExpandAll(!expandAll)}
              className="ml-auto flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
            >
              {expandAll ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m18 15-6-6-6 6" />
                  </svg>
                  Collapse All
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                  Expand All
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="flex overflow-y-auto w-full">
          <div className="flex flex-col items-start justify-start w-full p-6">
            <div className="w-full">
              <div className="flex flex-col items-start justify-start gap-4 w-full">
                {Object.entries(threadData.thread.values || {}).map(([key, value], idx) => (
                  <StateViewObject
                    key={`state-view-${key}-${idx}`}
                    keyName={key}
                    value={value}
                    expanded={expandAll}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For interrupted threads, show the action view with state panel
  if (
    threadData.status !== "interrupted" ||
    !threadData.interrupts ||
    threadData.interrupts.length === 0
  ) {
    return null;
  }

  return (
    <div className="flex flex-col lg:flex-row w-full h-full">
      <div
        className={cn(
          "flex overflow-y-auto",
          showSidePanel ? "lg:min-w-1/2 lg:max-w-2xl w-full" : "w-full"
        )}
      >
        <ThreadActionsView<ThreadValues>
          threadData={
            threadData as {
              thread: Thread<ThreadValues>;
              status: "interrupted";
              interrupts: HumanInterrupt[];
            }
          }
          setThreadData={setThreadData}
          handleShowSidePanel={handleShowSidePanel}
          showState={showState}
          showDescription={showDescription}
        />
      </div>
      <div
        className={cn(
          showSidePanel ? "flex" : "hidden",
          "overflow-y-auto lg:max-w-1/2 w-full"
        )}
      >
        <StateView
          handleShowSidePanel={handleShowSidePanel}
          threadData={threadData}
          view={showState ? "state" : "description"}
        />
      </div>
    </div>
  );
}
