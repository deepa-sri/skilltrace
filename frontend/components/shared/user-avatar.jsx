import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function initialsOf(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}

export function UserAvatar({ name, className }) {
  return (
    <Avatar className={cn("size-10", className)}>
      <AvatarFallback className="bg-gradient-to-br from-blue-100 to-teal-100 font-semibold text-blue-700">
        {initialsOf(name)}
      </AvatarFallback>
    </Avatar>
  );
}
