import { useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/content/PageHeader";
import { 
  TrustLevel, 
  trustLevelInfo,
  DirectoryTool 
} from "@/data/directoryToolsData";
import { useTools } from "@/lib/tools";
import { TrustBadge } from "@/components/directory/TrustBadge";
import { ReviewChecklistPanel } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, Calendar, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type QueueFilter = 'unreviewed' | 'reviewed' | 'all';

const ReviewQueue = () => {
  const { toast } = useToast();
  const { tools, updateToolTrustLevel, updateToolLastReviewed } = useTools();
  const [filter, setFilter] = useState<QueueFilter>('all');
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [updatingToolId, setUpdatingToolId] = useState<string | null>(null);

  // Compute counts from the live tools state
  const unreviewedCount = tools.filter(t => t.trustLevel === 'unreviewed').length;
  const reviewedCount = tools.filter(t => t.trustLevel === 'reviewed').length;
  const allPendingCount = unreviewedCount + reviewedCount;

  // Get tools that need review (unreviewed and reviewed only)
  const queuedTools = tools.filter(tool => {
    if (filter === 'all') {
      return tool.trustLevel === 'unreviewed' || tool.trustLevel === 'reviewed';
    }
    return tool.trustLevel === filter;
  });

  const handlePromote = async (tool: DirectoryTool, newLevel: TrustLevel) => {
    if (tool.trustLevel === newLevel) return;
    
    setUpdatingToolId(tool.id);
    try {
      await updateToolTrustLevel(tool.id, newLevel);
      toast({
        title: "Saved",
        description: `${tool.name} updated to ${trustLevelInfo[newLevel].label}.`,
      });
      setExpandedTool(null);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update ${tool.name}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setUpdatingToolId(null);
    }
  };

  const handleUpdateReviewed = async (tool: DirectoryTool) => {
    setUpdatingToolId(tool.id);
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    try {
      await updateToolLastReviewed(tool.id, dateStr);
      toast({
        title: "Saved",
        description: `${tool.name} marked as reviewed today.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update review date. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setUpdatingToolId(null);
    }
  };

  const trustLevelOptions: TrustLevel[] = ['unreviewed', 'reviewed', 'recommended', 'core', 'archived'];

  return (
    <AppLayout>
      <PageHeader
        title="Review Queue"
        description="Assess tools and manage the promotion ladder."
      />

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation whitespace-nowrap",
            filter === 'all'
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          )}
        >
          All pending ({allPendingCount})
        </button>
        <button
          onClick={() => setFilter('unreviewed')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation whitespace-nowrap",
            filter === 'unreviewed'
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          )}
        >
          Unreviewed ({unreviewedCount})
        </button>
        <button
          onClick={() => setFilter('reviewed')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation whitespace-nowrap",
            filter === 'reviewed'
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          )}
        >
          Reviewed ({reviewedCount})
        </button>
      </div>

      {/* Queue list */}
      <div className="space-y-3">
        {queuedTools.length > 0 ? (
          queuedTools.map(tool => (
            <div
              key={tool.id}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              {/* Tool header */}
              <button
                onClick={() => setExpandedTool(expandedTool === tool.id ? null : tool.id)}
                className="w-full p-4 flex items-center justify-between gap-3 touch-manipulation text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{tool.name}</h3>
                    <TrustBadge level={tool.trustLevel} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {tool.bestFor}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Last reviewed: {tool.lastReviewed}
                  </p>
                </div>
                {expandedTool === tool.id ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
              </button>

              {/* Expanded actions */}
              {expandedTool === tool.id && (
                <div className="px-4 pb-4 border-t border-border pt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Left column - Actions */}
                    <div>
                      {/* Change trust level */}
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Change trust level</p>
                        <div className="flex flex-wrap gap-2">
                          {trustLevelOptions.map(level => (
                            <button
                              key={level}
                              onClick={() => handlePromote(tool, level)}
                              disabled={tool.trustLevel === level || updatingToolId === tool.id}
                              className={cn(
                                "px-3 py-1.5 text-xs rounded-md transition-colors touch-manipulation flex items-center gap-1",
                                tool.trustLevel === level
                                  ? "bg-primary text-primary-foreground cursor-not-allowed"
                                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80",
                                updatingToolId === tool.id && "opacity-50 cursor-wait"
                              )}
                            >
                              {updatingToolId === tool.id && tool.trustLevel !== level && (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              )}
                              {trustLevelInfo[level].label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Quick actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateReviewed(tool)}
                          disabled={updatingToolId === tool.id}
                        >
                          {updatingToolId === tool.id ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Calendar className="h-4 w-4 mr-1" />
                          )}
                          Mark reviewed today
                        </Button>
                        <Link to={tool.coreToolId ? `/tools/${tool.coreToolId}` : `/directory/${tool.id}`}>
                          <Button variant="ghost" size="sm">
                            View details
                            <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Right column - Checklist */}
                    <div>
                      <ReviewChecklistPanel toolName={tool.name} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-8 text-center bg-card rounded-xl border border-border">
            <p className="text-muted-foreground">No tools in the queue.</p>
            <Link to="/admin/add-tool" className="text-primary hover:underline text-sm mt-2 inline-block">
              Add a new tool →
            </Link>
          </div>
        )}
      </div>

      {/* Add tool link */}
      <div className="mt-8 p-4 rounded-xl bg-muted/50 border border-border flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Need to capture a new tool?
        </p>
        <Link to="/admin/tools/add">
          <Button variant="outline" size="sm">
            Add Tool
          </Button>
        </Link>
      </div>
    </AppLayout>
  );
};

export default ReviewQueue;
