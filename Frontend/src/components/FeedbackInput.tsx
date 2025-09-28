import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles, MessageSquare } from "lucide-react";
interface FeedbackInputProps {
  onSubmit: (feedback: string) => void;
  isLoading: boolean;
}

const samplePrompts = [
  "Customer complains about delayed delivery. Provide an empathetic response and offer options (order #12345)",
  "Item arrived damaged. Apologize, explain replacement/refund options, and next steps",
  "Customer requests refund for defective product. Ask key details and propose a resolution",
  "Size/fit issue for apparel. Guide the customer through exchange policy and sizing help",
  "Package marked delivered but not received. Explain investigation process and timeline"
];

export const FeedbackInput = ({ onSubmit, isLoading }: FeedbackInputProps) => {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSubmit(input.trim());
    }
  };

  const handleSampleClick = (sample: string) => {
    setInput(sample);
  };

  return (
    <Card className="shadow-card border-border/50 gradient-subtle">
      <div className="p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 gradient-ai rounded-xl flex items-center justify-center shadow-ai">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
              AI Feedback Generator
            </h2>
          </div>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Designed for support interactions. Paste a message or scenario to get a clear, empathetic response.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-ai-primary" />
              <span className="text-sm font-medium">Quick Start Examples</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((prompt, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-ai-primary/10 hover:text-ai-primary hover:border-ai-primary/20 transition-smooth text-xs"
                  onClick={() => handleSampleClick(prompt)}
                >
                  {prompt}
                </Badge>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter the customer message or case details... (e.g., refund request, delayed order, damaged item, size issue, etc.)"
                className="min-h-[120px] resize-none gradient-input border-border/50 focus:border-ai-primary/50 transition-smooth"
                disabled={isLoading}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-xs text-muted-foreground">
                {input.length} characters
              </div>
              <Button
                type="submit"
                variant="ai"
                disabled={!input.trim() || isLoading}
                className="min-w-[120px]"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Generate Feedback
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Card>
  );
};