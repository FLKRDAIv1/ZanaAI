import React from 'react';
import { PromptBox } from "@/components/ui/chatgpt-prompt-input";

export default function App() {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const message = formData.get("message");
    
    // Check if there is an image uploaded via the hidden file input
    const imageFile = formData.get("image") as File;
    const hasImage = imageFile && imageFile.size > 0;

    if (!message && !hasImage) {
      return;
    }
    
    alert(`Message Submitted: ${message}\nHas Image: ${hasImage}`);
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background dark:bg-[#212121] p-4 text-foreground">
      <div className="w-full max-w-xl flex flex-col gap-10">
          <p className="text-center text-3xl font-semibold">
            How Can I Help You?
          </p>
          <form onSubmit={handleSubmit} className="w-full">
            <PromptBox name="message" />
          </form>
      </div>
    </div>
  );
}
