import { Heart } from 'lucide-react';

export function AdminFooter() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-12 items-center justify-between px-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <p>© 2024 SMS Globe Admin Panel</p>
          <span>•</span>
          <p>Version 1.0.0</p>
        </div>
        
        <div className="flex items-center gap-1">
          <span>Made with</span>
          <Heart className="h-3 w-3 fill-red-500 text-red-500" />
          <span>by the SMS Globe Team</span>
        </div>
      </div>
    </footer>
  );
}