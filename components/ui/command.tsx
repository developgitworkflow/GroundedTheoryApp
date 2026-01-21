import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "../../lib/utils"

// Context to manage search state
const CommandContext = React.createContext<{
    search: string;
    setSearch: (s: string) => void;
} | undefined>(undefined);

const Command = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
    const [search, setSearch] = React.useState("")
    return (
        <CommandContext.Provider value={{ search, setSearch }}>
            <div ref={ref} className={cn("flex h-full w-full flex-col overflow-hidden rounded-md bg-zinc-950 text-zinc-50", className)} {...props} />
        </CommandContext.Provider>
    )
})
Command.displayName = "Command"

const CommandInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => {
    const context = React.useContext(CommandContext)
    if(!context) throw new Error("CommandInput must be used within Command")
    
    return (
        <div className="flex items-center border-b border-zinc-800 px-3" cmdk-input-wrapper="">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
                ref={ref}
                className={cn(
                    "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                value={context.search}
                onChange={(e) => context.setSearch(e.target.value)}
                {...props}
            />
        </div>
    )
})
CommandInput.displayName = "CommandInput"

const CommandList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
))
CommandList.displayName = "CommandList"

const CommandEmpty = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => {
    return <div ref={ref} className="py-6 text-center text-sm" {...props} />
})
CommandEmpty.displayName = "CommandEmpty"

const CommandGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { heading?: React.ReactNode }>(({ className, heading, children, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "overflow-hidden p-1 text-zinc-50 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-zinc-500",
                className
            )}
            {...props}
        >
            {heading && <div cmdk-group-heading="" className="px-2 py-1.5 text-xs font-medium text-zinc-400 uppercase tracking-wider">{heading}</div>}
            {children}
        </div>
    )
})
CommandGroup.displayName = "CommandGroup"

const CommandItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { onSelect?: () => void, value?: string }>(({ className, onSelect, onClick, value, children, ...props }, ref) => {
    const context = React.useContext(CommandContext)
    // Filter logic: Check if children text or value includes search term
    // This is a naive client-side implementation for the "lite" version
    const textValue = value || (typeof children === 'string' ? children : '') || '';
    const isVisible = !context?.search || textValue.toLowerCase().includes(context.search.toLowerCase());

    if (!isVisible) return null;

    return (
        <div
            ref={ref}
            className={cn(
                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-zinc-800 aria-selected:text-zinc-50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-zinc-800 hover:text-zinc-50 cursor-pointer transition-colors group",
                className
            )}
            onClick={(e) => {
                onSelect?.();
                onClick?.(e);
            }}
            {...props}
        >
            {children}
        </div>
    )
})
CommandItem.displayName = "CommandItem"

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-zinc-500",
        className
      )}
      {...props}
    />
  )
}
CommandShortcut.displayName = "CommandShortcut"

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
}
