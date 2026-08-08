
import { cn } from "@/lib/utils";

export const GoogleIcon = ({ className }: { className?: string }) => (
  <svg
    className={cn("h-4 w-4", className)}
    aria-hidden="true"
    focusable="false"
    data-prefix="fab"
    data-icon="google"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 488 512"
  >
    <path
      fill="currentColor"
      d="M488 261.8C488 403.3 381.5 512 244 512S0 403.3 0 261.8 106.5 11.6 244 11.6c67.3 0 121.5 24.3 166.5 66.2l-69.5 68.3c-24-23.2-56.3-39.3-97-39.3-75.3 0-136.3 60.8-136.3 136.3s61 136.3 136.3 136.3c83.8 0 119-58.8 123.3-88.3H244v-85.8h244z"
    ></path>
  </svg>
);
