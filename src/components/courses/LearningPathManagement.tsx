import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { LearningPath, Course } from "@/lib/courses/types";
import {
  getLearningPaths,
  saveLearningPath,
  deleteLearningPath,
  getCourses,
} from "@/lib/courses/coursesStore";

interface LearningPathManagementProps {
  onClose?: () => void;
}

export function LearningPathManagement({ onClose }: LearningPathManagementProps) {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingPath, setEditingPath] = useState<LearningPath | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setPaths(getLearningPaths());
    setCourses(getCourses());
  };

  const toggleExpand = (pathId: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(pathId)) {
        next.delete(pathId);
      } else {
        next.add(pathId);
      }
      return next;
    });
  };

  const handleCreateNew = () => {
    setEditingPath({
      id: `path-${Date.now()}`,
      title: "",
      description: "",
      courseIds: [],
      defaultOpen: false,
    });
    setIsEditorOpen(true);
  };

  const handleEdit = (path: LearningPath) => {
    setEditingPath({ ...path });
    setIsEditorOpen(true);
  };

  const handleSave = () => {
    if (!editingPath) return;

    if (!editingPath.title.trim()) {
      toast.error("Title is required");
      return;
    }

    saveLearningPath(editingPath);
    toast.success(paths.find(p => p.id === editingPath.id) ? "Learning path updated" : "Learning path created");
    setIsEditorOpen(false);
    setEditingPath(null);
    loadData();
  };

  const handleDelete = (id: string) => {
    deleteLearningPath(id);
    toast.success("Learning path deleted");
    setDeleteConfirmId(null);
    loadData();
  };

  const handleToggleDefaultOpen = (path: LearningPath) => {
    const updated = { ...path, defaultOpen: !path.defaultOpen };
    saveLearningPath(updated);
    loadData();
    toast.success(`Auto-expand ${updated.defaultOpen ? "enabled" : "disabled"}`);
  };

  const getCourseName = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course?.title || courseId;
  };

  const addCourseToPath = (courseId: string) => {
    if (!editingPath) return;
    if (editingPath.courseIds.includes(courseId)) return;
    setEditingPath({
      ...editingPath,
      courseIds: [...editingPath.courseIds, courseId],
    });
  };

  const removeCourseFromPath = (courseId: string) => {
    if (!editingPath) return;
    setEditingPath({
      ...editingPath,
      courseIds: editingPath.courseIds.filter(id => id !== courseId),
    });
  };

  const moveCourse = (fromIndex: number, toIndex: number) => {
    if (!editingPath) return;
    const newIds = [...editingPath.courseIds];
    const [removed] = newIds.splice(fromIndex, 1);
    newIds.splice(toIndex, 0, removed);
    setEditingPath({
      ...editingPath,
      courseIds: newIds,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Learning Paths</h3>
          <p className="text-sm text-muted-foreground">
            Manage curated learning paths and their courses
          </p>
        </div>
        <Button onClick={handleCreateNew} size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          Add Path
        </Button>
      </div>

      {/* Paths List */}
      <div className="space-y-3">
        {paths.map(path => (
          <Card key={path.id} className="overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleExpand(path.id)}
                  className="mt-1 p-0.5 hover:bg-muted rounded"
                >
                  {expandedPaths.has(path.id) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{path.title}</CardTitle>
                    {path.defaultOpen && (
                      <Badge variant="secondary" className="text-xs">
                        Auto-expand
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                    {path.description}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {path.courseIds.length} course{path.courseIds.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`expand-${path.id}`} className="text-xs text-muted-foreground">
                      Auto-expand
                    </Label>
                    <Switch
                      id={`expand-${path.id}`}
                      checked={path.defaultOpen || false}
                      onCheckedChange={() => handleToggleDefaultOpen(path)}
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(path)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirmId(path.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {expandedPaths.has(path.id) && (
              <CardContent className="p-4 pt-2 border-t bg-muted/30">
                <div className="space-y-1">
                  {path.courseIds.map((courseId, index) => (
                    <div
                      key={courseId}
                      className="flex items-center gap-2 px-2 py-1.5 rounded bg-background text-sm"
                    >
                      <span className="w-5 h-5 flex items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="flex-1 truncate">{getCourseName(courseId)}</span>
                    </div>
                  ))}
                  {path.courseIds.length === 0 && (
                    <p className="text-sm text-muted-foreground italic px-2">
                      No courses added yet
                    </p>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {paths.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No learning paths yet. Click "Add Path" to create one.
          </div>
        )}
      </div>

      {/* Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPath && paths.find(p => p.id === editingPath.id)
                ? "Edit Learning Path"
                : "Create Learning Path"}
            </DialogTitle>
            <DialogDescription>
              Set the title, description, and courses for this learning path.
            </DialogDescription>
          </DialogHeader>

          {editingPath && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editingPath.title}
                  onChange={e =>
                    setEditingPath({ ...editingPath, title: e.target.value })
                  }
                  placeholder="e.g., Complete Beginner"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingPath.description}
                  onChange={e =>
                    setEditingPath({ ...editingPath, description: e.target.value })
                  }
                  placeholder="A brief description of this learning path..."
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="defaultOpen"
                  checked={editingPath.defaultOpen || false}
                  onCheckedChange={checked =>
                    setEditingPath({ ...editingPath, defaultOpen: checked })
                  }
                />
                <Label htmlFor="defaultOpen" className="text-sm">
                  Auto-expand courses by default
                </Label>
              </div>

              <div className="space-y-2">
                <Label>Courses in Path</Label>
                <div className="border rounded-lg p-2 space-y-1 min-h-[80px] bg-muted/30">
                  {editingPath.courseIds.map((courseId, index) => (
                    <div
                      key={courseId}
                      className="flex items-center gap-2 px-2 py-1.5 rounded bg-background text-sm group"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <span className="w-5 h-5 flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="flex-1 truncate">{getCourseName(courseId)}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {index > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => moveCourse(index, index - 1)}
                          >
                            ↑
                          </Button>
                        )}
                        {index < editingPath.courseIds.length - 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => moveCourse(index, index + 1)}
                          >
                            ↓
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={() => removeCourseFromPath(courseId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {editingPath.courseIds.length === 0 && (
                    <p className="text-sm text-muted-foreground italic text-center py-4">
                      Add courses from the dropdown below
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Add Course</Label>
                <Select onValueChange={addCourseToPath}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a course to add..." />
                  </SelectTrigger>
                  <SelectContent>
                    {courses
                      .filter(c => !editingPath.courseIds.includes(c.id))
                      .map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    {courses.filter(c => !editingPath.courseIds.includes(c.id)).length === 0 && (
                      <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                        All courses have been added
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="gap-1">
              <Save className="h-4 w-4" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Learning Path</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this learning path? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
