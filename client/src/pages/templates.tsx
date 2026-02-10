import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  hashtags: z.string().optional(),
  category: z.string().optional(),
  isPublic: z.boolean().default(false),
});

type TemplateFormData = z.infer<typeof templateSchema>;

export default function Templates() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: templates, isLoading } = useQuery({
    queryKey: ["/api/templates"],
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const payload = {
        ...data,
        hashtags: data.hashtags ? data.hashtags.split(',').map(tag => tag.trim()) : [],
      };
      return await apiRequest("POST", "/api/templates", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Template created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      description: "",
      content: "",
      hashtags: "",
      category: "",
      isPublic: false,
    },
  });

  const onSubmit = (data: TemplateFormData) => {
    createTemplateMutation.mutate(data);
  };

  // Demo templates for empty state
  const demoTemplates = [
    {
      id: "demo-1",
      name: "SaaS Product Launch Hook",
      description: "Attention-grabbing hooks for SaaS product launches",
      content: "🚀 Just launched our game-changing SaaS tool!\n\nWhat it does:\n✅ Saves 10+ hours/week\n✅ Automates tedious tasks\n✅ Boosts productivity by 300%\n\nWho else is tired of manual work? 👇",
      hashtags: ["saas", "productivity", "startup", "automation"],
      category: "launch",
      isPublic: true,
    },
    {
      id: "demo-2", 
      name: "B2B Pain Point Reel",
      description: "Templates for B2B pain point identification content",
      content: "POV: You're a B2B founder and...\n\n❌ Your sales process takes forever\n❌ Lead qualification is manual\n❌ You're losing deals to competitors\n\nSound familiar? Here's how we fixed it 👇",
      hashtags: ["b2b", "sales", "leadgen", "business"],
      category: "pain-point",
      isPublic: true,
    },
    {
      id: "demo-3",
      name: "UGC Product Review",
      description: "User-generated content templates for product reviews",
      content: "Honest review after 30 days using [PRODUCT]:\n\n✨ What I loved:\n• Feature 1 - saved me X hours\n• Feature 2 - increased efficiency\n• Feature 3 - simplified workflow\n\n🤔 What could improve:\n• Minor issue 1\n• Suggestion 2\n\nOverall rating: 4.5/5 ⭐\n\nWho wants a demo?",
      hashtags: ["review", "ugc", "product", "honest"],
      category: "review",
      isPublic: true,
    },
  ];

  const displayTemplates = templates?.length > 0 ? templates : demoTemplates;
  const filteredTemplates = displayTemplates?.filter((template: any) =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Templates"
          description="Pre-built content templates to speed up your content creation process."
          actions={
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  data-testid="button-create-template"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Template</DialogTitle>
                  <DialogDescription>
                    Create a reusable content template for your campaigns.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Template Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., SaaS Launch Hook" {...field} data-testid="input-template-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Brief description of the template" {...field} data-testid="input-template-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-template-category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="launch">Product Launch</SelectItem>
                              <SelectItem value="pain-point">Pain Point</SelectItem>
                              <SelectItem value="review">Review/UGC</SelectItem>
                              <SelectItem value="educational">Educational</SelectItem>
                              <SelectItem value="promotional">Promotional</SelectItem>
                              <SelectItem value="engagement">Engagement</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Write your template content here. Use placeholders like [PRODUCT] for dynamic content."
                              className="min-h-[120px]"
                              {...field}
                              data-testid="textarea-template-content"
                            />
                          </FormControl>
                          <FormDescription>
                            Use placeholders like [PRODUCT], [BENEFIT], [CTA] for dynamic content
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="hashtags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hashtags</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="saas, productivity, startup (comma separated)"
                              {...field}
                              data-testid="input-template-hashtags"
                            />
                          </FormControl>
                          <FormDescription>
                            Separate hashtags with commas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                        data-testid="button-cancel-template"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createTemplateMutation.isPending}
                        data-testid="button-save-template"
                      >
                        {createTemplateMutation.isPending ? "Creating..." : "Create Template"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          }
        />
        
        <div className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-sm">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-templates"
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full mb-4" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {filteredTemplates?.length === 0 ? (
                <div className="text-center py-20">
                  <i className="fas fa-file-alt text-6xl text-muted-foreground mb-4"></i>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No templates found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchTerm ? "Try adjusting your search terms." : "Create your first template to get started."}
                  </p>
                  {!searchTerm && (
                    <Button 
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      data-testid="button-create-first-template"
                    >
                      <i className="fas fa-plus mr-2"></i>
                      Create Template
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTemplates?.map((template: any) => (
                    <Card 
                      key={template.id} 
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      data-testid={`template-card-${template.id}`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{template.name}</CardTitle>
                            <CardDescription className="mt-1">
                              {template.description || "No description available"}
                            </CardDescription>
                          </div>
                          {template.isPublic && (
                            <Badge variant="secondary" className="text-xs">
                              Public
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {template.content}
                          </p>
                        </div>
                        
                        {template.hashtags && template.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {template.hashtags.slice(0, 3).map((hashtag: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                #{hashtag}
                              </Badge>
                            ))}
                            {template.hashtags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.hashtags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          {template.category && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {template.category}
                            </Badge>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost"
                            data-testid={`button-use-template-${template.id}`}
                          >
                            <i className="fas fa-copy mr-2"></i>
                            Use Template
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
