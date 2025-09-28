import React, { useState } from "react";

import { FeedbackInput } from "@/components/FeedbackInput";
import { FeedbackOutput } from "@/components/FeedbackOutput";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Settings, History, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateFeedback } from "@/lib/api";

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface FeedbackResponse {
  id: string;
  input: string;
  output: string;
  timestamp: Date;
  rating?: 'positive' | 'negative';
  history: ChatMessage[];
}

const Index = () => {
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Call backend to generate feedback via Ollama
  const handleFeedbackSubmit = async (input: string) => {
    setIsLoading(true);
    
    try {
      const resp = await generateFeedback({
        message: input,
        tone: "empathetic",
        language: "en",
        options: { max_tokens: 300 }
      });

      const newResponse: FeedbackResponse = {
        id: resp.id,
        input,
        output: resp.output,
        timestamp: new Date(),
        history: [
          { role: 'user', content: input },
          { role: 'assistant', content: resp.output }
        ]
      };

      setResponses(prev => [newResponse, ...prev]);
      
      toast({
        title: "Feedback Generated",
        description: "Your AI feedback is ready!",
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error?.message || "Failed to generate feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRate = (id: string, rating: 'positive' | 'negative') => {
    setResponses(prev => prev.map(response => 
      response.id === id ? { ...response, rating } : response
    ));
    
    toast({
      title: "Feedback Rated",
      description: `Thanks for rating this ${rating === 'positive' ? 'positively' : 'negatively'}!`,
    });
  };

  const clearHistory = () => {
    setResponses([]);
    toast({
      title: "History Cleared",
      description: "All feedback history has been cleared.",
    });
  };

  // Follow-up reply for an existing response (chat continuation)
  const handleFollowUp = async (id: string, message: string) => {
    setIsLoading(true);
    try {
      const target = responses.find(r => r.id === id);
      if (!target) return;
      const history = target.history || [];

      const resp = await generateFeedback({
        message,
        tone: "empathetic",
        language: "en",
        history: [...history, { role: 'user', content: message }],
        options: { max_tokens: 300 }
      });

      setResponses(prev => prev.map(r =>
        r.id === id
          ? {
              ...r,
              input: message,
              output: resp.output,
              timestamp: new Date(),
              history: [
                ...history,
                { role: 'user', content: message },
                { role: 'assistant', content: resp.output }
              ]
            }
          : r
      ));
    } catch (error: any) {
      toast({
        title: "Follow-up Failed",
        description: error?.message || "Failed to send follow-up.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-subtle">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 gradient-ai rounded-lg flex items-center justify-center shadow-ai">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
                  Feedback Bot
                </h1>
                <p className="text-xs text-muted-foreground">Powered by Shankar V</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {responses.length > 0 && (
                <Button
                  variant="ai-ghost"
                  size="sm"
                  onClick={clearHistory}
                >
                  <History className="w-4 h-4" />
                  Clear History
                </Button>
              )}
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Hero Section */}
          <div className="text-center space-y-4 py-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-ai-primary via-ai-secondary to-ai-accent bg-clip-text text-transparent">
              AI-Powered Feedback Generation
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get intelligent, contextual feedback on any content using your custom Ollama model.
              Perfect for reviews, evaluations, and constructive analysis.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="p-4 text-center shadow-card border-border/50">
              <div className="text-2xl font-bold text-ai-primary">{responses.length}</div>
              <div className="text-sm text-muted-foreground">Feedback Generated</div>
            </Card>
            <Card className="p-4 text-center shadow-card border-border/50">
              <div className="text-2xl font-bold text-ai-secondary">Feedback generator</div>
              <div className="text-sm text-muted-foreground">By Shankar V</div>
            </Card>
            <Card className="p-4 text-center shadow-card border-border/50">
              <div className="text-2xl font-bold text-ai-accent">
                {responses.filter(r => r.rating === 'positive').length}
              </div>
              <div className="text-sm text-muted-foreground">Positive Ratings</div>
            </Card>
          </div>

          {/* Input Section */}
          <FeedbackInput onSubmit={handleFeedbackSubmit} isLoading={isLoading} />

          {/* Output Section */}
          <FeedbackOutput responses={responses} onRate={handleRate} onReply={handleFollowUp} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>Feedback Bot • Powered by Ollama AI • Built with React & TypeScript</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;