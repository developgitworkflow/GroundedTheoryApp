import * as React from "react";
import { cn } from "../../lib/utils";

const HoverCardContext = React.createContext<{
  open: boolean;
  openDelay: number;
  closeDelay: number;
  onOpenChange: (open: boolean) => void;
} | null>(null);

interface HoverCardProps {
  children: React.ReactNode;
  openDelay?: number;
  closeDelay?: number;
  defaultOpen?: boolean;
}

const HoverCard: React.FC<HoverCardProps> = ({
  children,
  openDelay = 200,
  closeDelay = 300,
  defaultOpen = false,
}) => {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <HoverCardContext.Provider value={{ open, openDelay, closeDelay, onOpenChange: setOpen }}>
      <div className="relative inline-block group">
        {children}
      </div>
    </HoverCardContext.Provider>
  );
};

const HoverCardTrigger: React.FC<React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }> = ({ 
  className, 
  children, 
  asChild,
  ...props 
}) => {
  const context = React.useContext(HoverCardContext);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!context) throw new Error("HoverCardTrigger must be used within HoverCard");

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      context.onOpenChange(true);
    }, context.openDelay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      context.onOpenChange(false);
    }, context.closeDelay);
  };

  const Comp = asChild ? React.Fragment : "div";

  // If asChild is true, we need to clone the child to attach event listeners
  if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<any>;
      return React.cloneElement(child, {
          onMouseEnter: (e: React.MouseEvent) => {
              handleMouseEnter();
              child.props.onMouseEnter?.(e);
          },
          onMouseLeave: (e: React.MouseEvent) => {
              handleMouseLeave();
              child.props.onMouseLeave?.(e);
          },
          className: cn(child.props.className, className)
      });
  }

  return (
    <div
      className={cn("inline-block", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
};

const HoverCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { align?: "start" | "center" | "end", side?: "top" | "right" | "bottom" | "left" }
>(({ className, align = "center", side = "bottom", style, ...props }, ref) => {
  const context = React.useContext(HoverCardContext);
  if (!context) throw new Error("HoverCardContent must be used within HoverCard");

  if (!context.open) return null;

  // Simple positioning logic for this implementation
  // In a real Radix app, this is handled by Popper.js. 
  // We mimic common placements using absolute positioning classes.
  
  let positionClasses = "";
  if (side === "top") positionClasses = "bottom-full mb-2";
  if (side === "bottom") positionClasses = "top-full mt-2";
  if (side === "right") positionClasses = "left-full ml-2 top-0";
  if (side === "left") positionClasses = "right-full mr-2 top-0";

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 w-64 rounded-md border border-zinc-800 bg-zinc-950 p-4 text-zinc-50 shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        positionClasses,
        className
      )}
      {...props}
    />
  );
});
HoverCardContent.displayName = "HoverCardContent";

export { HoverCard, HoverCardTrigger, HoverCardContent };