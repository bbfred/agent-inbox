"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Clipboard, Copy, LoaderCircle, Play, Send } from "lucide-react";
import { AGENT_INBOX_PARAM, INBOX_PARAM, START_VIEW_PARAM_VALUE } from "../constants";
import Link from "next/link";
import { useThreadsContext } from "../contexts/ThreadContext";
import { InputSchemaField } from "../contexts/ThreadContext";
import { useQueryParams } from "../hooks/use-query-params";
import { cn } from "@/lib/utils";
import { ThreadStatusWithAll } from "../types";

export interface AgentConfig {
  id: string;
  name: string;
  graphId: string;
  inputSchema: InputSchemaField[];
}

interface AgentTriggerFormProps {
  agentConfig: AgentConfig | null;
  changeInbox: (inbox: ThreadStatusWithAll | typeof START_VIEW_PARAM_VALUE) => Promise<void>;
}

export function AgentTriggerForm({ agentConfig, changeInbox }: AgentTriggerFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [newThreadId, setNewThreadId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [schema, setSchema] = useState<InputSchemaField[]>([]);
  const { toast } = useToast();
  const { triggerNewRun, fetchSchema } = useThreadsContext();
  const { updateQueryParams } = useQueryParams();
  
  const handleBackClick = () => {
    // Navigate back to the interrupted view
    changeInbox("interrupted");
  };
  
  const handleCopyThreadId = () => {
    if (newThreadId) {
      navigator.clipboard.writeText(newThreadId);
      toast({ 
        title: "Copied", 
        description: "Thread ID copied to clipboard" 
      });
    }
  };

  // Fetch schema and reset form when agent changes
  useEffect(() => {
    setFormData({});
    setNewThreadId(null);
    setError(null);
    setLoading(false);
    
    if (agentConfig?.graphId) {
      setSchemaLoading(true);
      fetchSchema(agentConfig.graphId)
        .then(schema => {
          setSchema(schema);
        })
        .catch(err => {
          console.error("Error fetching schema:", err);
          toast({ 
            title: "Error", 
            description: `Failed to fetch input schema: ${err.message}`, 
            variant: "destructive" 
          });
          // Fall back to the default schema from agentConfig
          setSchema(agentConfig.inputSchema || []);
        })
        .finally(() => {
          setSchemaLoading(false);
        });
    }
  }, [agentConfig?.id, agentConfig?.graphId, fetchSchema, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentConfig?.graphId) {
      toast({ 
        title: "Error", 
        description: "No graph ID available for the selected agent.", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    setError(null);
    setNewThreadId(null);

    try {
      // Use the triggerNewRun function from ThreadsContext
      const result = await triggerNewRun(agentConfig.graphId, formData);
      
      setNewThreadId(result.thread_id);
      toast({ 
        title: "Success", 
        description: `Run started (Thread ID: ${result.thread_id})` 
      });
      setFormData({}); // Clear form on success

    } catch (err: any) {
      setError(err.message);
      toast({ 
        title: "Error", 
        description: err.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  // If no agent is selected
  if (!agentConfig) {
    return (
      <div className="p-8 space-y-4">
        <h2 className="text-xl font-semibold">Start New Run</h2>
        <p>Please select an agent from the sidebar.</p>
        <div className="space-y-2">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="h-10 w-[120px]" />
      </div>
    );
  }

  // Show loading state while fetching schema
  if (schemaLoading) {
    return (
      <div className="p-8 space-y-4">
        <h2 className="text-xl font-semibold mb-4">Start New Run: {agentConfig.name || agentConfig.graphId}</h2>
        <p className="text-gray-600 mb-4">Loading input form...</p>
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-20 w-full" />
          </div>
          <Skeleton className="h-10 w-[120px]" />
        </div>
      </div>
    );
  }
  
  // If schema is empty, show a default form
  if (schema.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackClick}
              className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
            >
              <ArrowLeft className="h-5 w-5 stroke-[1.5px]" />
            </Button>
            <h2 className="text-base font-medium">Start New Run: {agentConfig.name || agentConfig.graphId}</h2>
          </div>
        </div>
        <p className="text-gray-600 mb-4 text-sm">
          No input schema available for this agent. Using the default input form.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-[6px] items-start w-full">
            <Label htmlFor="input_prompt" className="text-sm min-w-fit font-medium capitalize">Input</Label>
            <Textarea
              id="input_prompt"
              name="input_prompt"
              value={formData["input_prompt"] || ''}
              onChange={handleChange}
              required
              rows={5}
              placeholder="Enter your input for the agent..."
              disabled={loading}
            />
          </div>
          <div className="flex items-center justify-end w-full gap-2">
            <Button 
              type="submit" 
              disabled={loading} 
              variant="brand"
              className="flex items-center gap-2"
            >
              {loading ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5 stroke-[1.5px]" />
              )}
              {loading ? 'Sending...' : 'Send Response'}
            </Button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 border rounded bg-red-50 border-red-200 text-red-700">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {newThreadId && (
          <div className="mt-4 p-4 border rounded bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-800 font-medium">Response sent successfully!</p>
                <p className="text-sm text-gray-700">Your response has been sent and a new thread was created.</p>
              </div>
              <Link
                href={`/?${AGENT_INBOX_PARAM}=${agentConfig.id}&inbox=busy&highlight_thread=${newThreadId}`}
                className="text-sm bg-white hover:bg-gray-50 text-gray-800 px-3 py-1.5 rounded border border-gray-200 inline-flex items-center gap-1.5"
              >
                <Play className="h-3.5 w-3.5 text-primary" />
                View Progress
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render the form with the fetched schema
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackClick}
            className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
          >
            <ArrowLeft className="h-5 w-5 stroke-[1.5px]" />
          </Button>
          <h2 className="text-base font-medium">Start New Run: {agentConfig.name || agentConfig.graphId}</h2>
        </div>
        
        {newThreadId && (
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">ID:</span>
              <span className="font-mono">{newThreadId}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCopyThreadId}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex items-center gap-1.5 ml-4">
              <span className="text-muted-foreground">State:</span>
              <span className="text-blue-600 font-medium">Running</span>
            </div>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {schema.map((field) => (
          <div key={field.name} className="flex flex-col gap-[6px] items-start w-full">
            <Label htmlFor={field.name} className="text-sm min-w-fit font-medium capitalize">
              {field.label || field.name.replace(/_/g, ' ')}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-xs text-muted-foreground mb-1">{field.description}</p>
            )}
            {field.type === 'textarea' ? (
              <Textarea
                id={field.name}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleChange}
                required={field.required}
                rows={field.rows || 3}
                placeholder={field.placeholder || ''}
                disabled={loading}
                className="w-full"
              />
            ) : (
              <Input
                id={field.name}
                name={field.name}
                type={field.type === 'number' ? 'number' : 'text'}
                value={formData[field.name] || ''}
                onChange={handleChange}
                required={field.required}
                placeholder={field.placeholder || ''}
                disabled={loading}
                className="w-full"
              />
            )}
          </div>
        ))}
        <div className="flex items-center justify-end w-full gap-2">
          <Button 
            type="submit" 
            disabled={loading} 
            variant="brand"
            className="flex items-center gap-2"
          >
              {loading ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5 stroke-[1.5px]" />
              )}
            {loading ? 'Sending...' : 'Send Response'}
          </Button>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-4 border rounded bg-red-50 border-red-200 text-red-700">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {newThreadId && (
        <div className="mt-4 p-4 border rounded bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-800 font-medium">Response sent successfully!</p>
              <p className="text-sm text-gray-700">Your response has been sent and a new thread was created.</p>
            </div>
            <Link
              href={`/?${AGENT_INBOX_PARAM}=${agentConfig.id}&inbox=busy&highlight_thread=${newThreadId}`}
              className="text-sm bg-white hover:bg-gray-50 text-gray-800 px-3 py-1.5 rounded border border-gray-200 inline-flex items-center gap-1.5"
            >
              <Play className="h-3.5 w-3.5 text-primary" />
              View Progress
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
