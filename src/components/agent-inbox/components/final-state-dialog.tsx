import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateViewObject } from "./state-view";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";

interface FinalStateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  error: string | null;
  stateData: Record<string, any> | null;
}

export function FinalStateDialog({
  open,
  onOpenChange,
  loading,
  error,
  stateData,
}: FinalStateDialogProps) {
  const [expanded, setExpanded] = useState(false);

  // Try to extract a title from the state data if available
  const title = stateData?.survey_title || stateData?.title || "Final Thread State";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{title}</span>
            <div className="flex gap-2">
              <Button
                onClick={() => setExpanded((prev) => !prev)}
                variant="ghost"
                className="text-gray-600"
                size="sm"
              >
                {expanded ? (
                  <ChevronsUpDown className="w-4 h-4" />
                ) : (
                  <ChevronsDownUp className="w-4 h-4" />
                )}
                <span className="ml-1 text-xs">
                  {expanded ? "Collapse All" : "Expand All"}
                </span>
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-md">
            <p className="font-medium">Error loading state data</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && stateData && (
          <div className="flex flex-col gap-4 py-2">
            {Object.entries(stateData).map(([key, value], idx) => (
              <StateViewObject
                key={`state-view-${key}-${idx}`}
                keyName={key}
                value={value}
                expanded={expanded}
              />
            ))}
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
