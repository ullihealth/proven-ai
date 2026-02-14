import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { VideoPlayer } from "@/components/daily/VideoPlayer";
import { 
  DayOfWeek, 
  DAYS_OF_WEEK, 
  DAY_CONFIG, 
  DailyFlowPost,
  DailyFlowVisualSettings,
  BackgroundMode,
  defaultDailyFlowVisualSettings,
} from "@/lib/dailyflow";
import {
  getAllPosts,
  getPublishedPostsForDay,
  getDraftsForDay,
  savePost,
  deletePost,
  publishPost,
  unpublishPost,
  getDayVisualSettings,
  saveDayVisualSettings,
} from "@/lib/dailyflow";
import { Plus, Edit2, Trash2, Eye, EyeOff, Video, ArrowLeft, Calendar, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { parseYouTubeUrl } from "@/lib/video/youtubeParser";

// Empty post template
const getEmptyPost = (day: DayOfWeek): Omit<DailyFlowPost, 'id' | 'createdAt' | 'updatedAt'> => ({
  day,
  title: '',
  description: '',
  videoType: 'url',
  videoUrl: '',
  caption: '',
  status: 'draft',
});

const DailyFlowManagement = () => {
  const [activeDay, setActiveDay] = useState<DayOfWeek>('monday');
  const [posts, setPosts] = useState<DailyFlowPost[]>([]);
  const [editingPost, setEditingPost] = useState<Partial<DailyFlowPost> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [visualSettings, setVisualSettings] = useState<Record<string, DailyFlowVisualSettings>>({});

  // Load posts and visual settings
  useEffect(() => {
    setPosts(getAllPosts());
    const settings: Record<string, DailyFlowVisualSettings> = {};
    DAYS_OF_WEEK.forEach(day => {
      settings[day] = getDayVisualSettings(day);
    });
    setVisualSettings(settings);
  }, []);

  // Refresh posts
  const refreshPosts = () => {
    setPosts(getAllPosts());
  };

  // Get posts for active day - now supports multiple published posts
  const publishedPosts = posts
    .filter(p => p.day === activeDay && p.status === 'published')
    .sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return dateB - dateA; // Newest first
    });
  const drafts = posts.filter(p => p.day === activeDay && p.status === 'draft');

  // Handle create new post
  const handleCreatePost = () => {
    setEditingPost(getEmptyPost(activeDay));
    setIsDialogOpen(true);
  };

  // Handle edit post
  const handleEditPost = (post: DailyFlowPost) => {
    setEditingPost({ ...post });
    setIsDialogOpen(true);
  };

  // Handle save post
  const handleSavePost = () => {
    if (!editingPost) return;
    
    if (!editingPost.title?.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!editingPost.description?.trim()) {
      toast.error('Description is required');
      return;
    }
    if (!editingPost.videoUrl?.trim()) {
      toast.error('Video URL is required');
      return;
    }

    const savedPost = savePost(editingPost as DailyFlowPost);
    toast.success(editingPost.id ? 'Post updated' : 'Post created');
    
    setIsDialogOpen(false);
    setEditingPost(null);
    refreshPosts();
  };

  // Handle delete post
  const handleDeletePost = (id: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      deletePost(id);
      toast.success('Post deleted');
      refreshPosts();
    }
  };

  // Handle publish/unpublish
  const handlePublish = (id: string) => {
    publishPost(id);
    toast.success('Post published');
    refreshPosts();
  };

  const handleUnpublish = (id: string) => {
    unpublishPost(id);
    toast.success('Post unpublished');
    refreshPosts();
  };

  // Handle visual settings change
  const handleVisualSettingsChange = (field: keyof DailyFlowVisualSettings, value: string) => {
    const updated = {
      ...visualSettings[activeDay],
      [field]: value,
    };
    setVisualSettings(prev => ({ ...prev, [activeDay]: updated }));
    saveDayVisualSettings(activeDay, updated);
  };

  // Reusable post card component for the admin list
  const PostListItem = ({ post, isPublished }: { post: DailyFlowPost; isPublished: boolean }) => (
    <div 
      key={post.id}
      className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30"
    >
      <div className="w-32 flex-shrink-0">
        <VideoPlayer videoUrl={post.videoUrl} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate">{post.title}</h4>
        <p className="text-sm text-muted-foreground line-clamp-1">{post.description}</p>
        {post.publishedAt && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(post.publishedAt), 'MMM d, yyyy h:mm a')}
          </p>
        )}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {!isPublished && (
          <Button variant="outline" size="sm" onClick={() => handlePublish(post.id)}>
            Publish
          </Button>
        )}
        {isPublished && (
          <Button variant="outline" size="sm" onClick={() => handleUnpublish(post.id)}>
            <EyeOff className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => handleEditPost(post)}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleDeletePost(post.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/admin" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Admin</span>
          </Link>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Daily Flow Posts</h1>
            <p className="text-muted-foreground">Manage video posts for each weekday</p>
          </div>
        </div>

        {/* Day Tabs */}
        <Tabs value={activeDay} onValueChange={(v) => setActiveDay(v as DayOfWeek)}>
          <TabsList className="grid w-full grid-cols-5">
            {DAYS_OF_WEEK.map(day => (
              <TabsTrigger key={day} value={day} className="capitalize">
                {DAY_CONFIG[day].label}
              </TabsTrigger>
            ))}
          </TabsList>

          {DAYS_OF_WEEK.map(day => (
            <TabsContent key={day} value={day} className="space-y-6">
              {/* Day Theme Info */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{DAY_CONFIG[day].theme}</h2>
                  <p className="text-sm text-muted-foreground">{DAY_CONFIG[day].description}</p>
                </div>
                <Button onClick={handleCreatePost}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="h-4 w-4 text-primary" />
                    Published Posts ({publishedPosts.length})
                  </CardTitle>
                  <CardDescription>
                    All visible posts for {DAY_CONFIG[day].label} (newest first)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {publishedPosts.length > 0 ? (
                    <div className="space-y-3">
                      {publishedPosts.map(post => (
                        <PostListItem key={post.id} post={post} isPublished={true} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No published posts for {DAY_CONFIG[day].label}. Create one and publish it.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Drafts */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    Drafts ({drafts.length})
                  </CardTitle>
                  <CardDescription>Unpublished posts for {DAY_CONFIG[day].label}</CardDescription>
                </CardHeader>
                <CardContent>
                  {drafts.length > 0 ? (
                    <div className="space-y-3">
                      {drafts.map(draft => (
                        <PostListItem key={draft.id} post={draft} isPublished={false} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No drafts for {DAY_CONFIG[day].label}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Visual Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Visual Settings</CardTitle>
                  <CardDescription>Customize the appearance of the {DAY_CONFIG[day].label} page</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Background Mode</Label>
                    <Select 
                      value={visualSettings[day]?.backgroundMode || 'plain'} 
                      onValueChange={(v) => handleVisualSettingsChange('backgroundMode', v as BackgroundMode)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plain">Plain (Light)</SelectItem>
                        <SelectItem value="gradient">Gradient (Dark)</SelectItem>
                        <SelectItem value="image">Background Image</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {visualSettings[day]?.backgroundMode === 'gradient' && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">From</Label>
                        <Input 
                          type="color" 
                          value={visualSettings[day]?.gradientFrom || '#0f1729'}
                          onChange={(e) => handleVisualSettingsChange('gradientFrom', e.target.value)}
                          className="h-10 p-1 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Via</Label>
                        <Input 
                          type="color" 
                          value={visualSettings[day]?.gradientVia || '#1a2540'}
                          onChange={(e) => handleVisualSettingsChange('gradientVia', e.target.value)}
                          className="h-10 p-1 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">To</Label>
                        <Input 
                          type="color" 
                          value={visualSettings[day]?.gradientTo || '#252f4a'}
                          onChange={(e) => handleVisualSettingsChange('gradientTo', e.target.value)}
                          className="h-10 p-1 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  {visualSettings[day]?.backgroundMode === 'image' && (
                    <div className="space-y-2">
                      <Label>Background Image URL</Label>
                      <Input 
                        placeholder="https://example.com/image.jpg"
                        value={visualSettings[day]?.backgroundImage || ''}
                        onChange={(e) => handleVisualSettingsChange('backgroundImage', e.target.value)}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex gap-2">
                      <Input 
                        type="color" 
                        value={visualSettings[day]?.accentColor || '#3b82f6'}
                        onChange={(e) => handleVisualSettingsChange('accentColor', e.target.value)}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input 
                        placeholder="#3b82f6"
                        value={visualSettings[day]?.accentColor || ''}
                        onChange={(e) => handleVisualSettingsChange('accentColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Post Editor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost?.id ? 'Edit Post' : 'Create New Post'}</DialogTitle>
            <DialogDescription>
              {editingPost?.id ? 'Update the post details below' : `Create a new video post for ${DAY_CONFIG[activeDay].label}`}
            </DialogDescription>
          </DialogHeader>

          {editingPost && (
            <div className="space-y-4">
              {/* Day Selection (for new posts only) */}
              {!editingPost.id && (
                <div className="space-y-2">
                  <Label>Day</Label>
                  <Select 
                    value={editingPost.day} 
                    onValueChange={(v) => setEditingPost(prev => prev ? { ...prev, day: v as DayOfWeek } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map(day => (
                        <SelectItem key={day} value={day}>
                          {DAY_CONFIG[day].label} – {DAY_CONFIG[day].theme}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input 
                  placeholder="Enter post title"
                  value={editingPost.title || ''}
                  onChange={(e) => setEditingPost(prev => prev ? { ...prev, title: e.target.value } : null)}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea 
                  placeholder="Enter post description"
                  value={editingPost.description || ''}
                  onChange={(e) => setEditingPost(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={3}
                />
              </div>

              {/* Video Type */}
              <div className="space-y-2">
                <Label>Video Source</Label>
                <RadioGroup 
                  value={editingPost.videoType || 'url'}
                  onValueChange={(v) => setEditingPost(prev => prev ? { ...prev, videoType: v as 'url' | 'upload' } : null)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="url" id="video-url" />
                    <Label htmlFor="video-url" className="cursor-pointer">Video URL</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="upload" id="video-upload" />
                    <Label htmlFor="video-upload" className="cursor-pointer">Upload MP4</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Video URL */}
              {editingPost.videoType === 'url' && (
                <div className="space-y-2">
                  <Label>Video URL *</Label>
                  <Input 
                    placeholder="https://youtube.com/watch?v=... or youtu.be/... or direct MP4 link"
                    value={editingPost.videoUrl || ''}
                    onChange={(e) => setEditingPost(prev => prev ? { ...prev, videoUrl: e.target.value } : null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste any YouTube link (watch, share, embed, shorts, live), Vimeo, HeyGen, or direct MP4 URL
                  </p>
                  {/* YouTube auto-normalisation preview */}
                  {(() => {
                    const parsed = editingPost.videoUrl ? parseYouTubeUrl(editingPost.videoUrl) : null;
                    if (!parsed) return null;
                    return (
                      <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          YouTube detected — will embed via privacy-enhanced mode
                        </div>
                        <div className="text-[11px] text-emerald-600 font-mono truncate">
                          {parsed.embedUrl}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Video Upload */}
              {editingPost.videoType === 'upload' && (
                <div className="space-y-2">
                  <Label>Upload MP4 *</Label>
                  <Input 
                    type="file"
                    accept="video/mp4"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const base64 = event.target?.result as string;
                          setEditingPost(prev => prev ? { ...prev, videoUrl: base64 } : null);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    MP4 files only. Large files may take time to process.
                  </p>
                </div>
              )}

              {/* Video Preview */}
              {editingPost.videoUrl && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <VideoPlayer videoUrl={editingPost.videoUrl} />
                </div>
              )}

              {/* Caption */}
              <div className="space-y-2">
                <Label>Caption (optional)</Label>
                <Textarea 
                  placeholder="Additional context or notes"
                  value={editingPost.caption || ''}
                  onChange={(e) => setEditingPost(prev => prev ? { ...prev, caption: e.target.value } : null)}
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              variant="outline"
              onClick={() => {
                if (editingPost) {
                  setEditingPost(prev => prev ? { ...prev, status: 'draft' } : null);
                  handleSavePost();
                }
              }}
            >
              Save as Draft
            </Button>
            <Button 
              onClick={() => {
                if (editingPost) {
                  setEditingPost(prev => prev ? { ...prev, status: 'published' } : null);
                  handleSavePost();
                }
              }}
            >
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default DailyFlowManagement;
