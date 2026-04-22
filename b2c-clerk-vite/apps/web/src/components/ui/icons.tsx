import { cn } from "@/lib/utils";

/* ── Brand ── */

export function IconGoogle({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      className={cn("size-4", className)}
      {...props}
    >
      <path
        d="M8.15991 6.54543V9.64362H12.4654C12.2763 10.64 11.709 11.4837 10.8581 12.0509L13.4544 14.0655C14.9671 12.6692 15.8399 10.6182 15.8399 8.18188C15.8399 7.61461 15.789 7.06911 15.6944 6.54552L8.15991 6.54543Z"
        fill="#4285F4"
      />
      <path
        d="M3.6764 9.52268L3.09083 9.97093L1.01807 11.5855C2.33443 14.1963 5.03241 16 8.15966 16C10.3196 16 12.1305 15.2873 13.4542 14.0655L10.8578 12.0509C10.1451 12.5309 9.23598 12.8219 8.15966 12.8219C6.07967 12.8219 4.31245 11.4182 3.67967 9.5273L3.6764 9.52268Z"
        fill="#34A853"
      />
      <path
        d="M1.01803 4.41455C0.472607 5.49087 0.159912 6.70543 0.159912 7.99995C0.159912 9.29447 0.472607 10.509 1.01803 11.5854C1.01803 11.5926 3.6799 9.51991 3.6799 9.51991C3.5199 9.03991 3.42532 8.53085 3.42532 7.99987C3.42532 7.46889 3.5199 6.95983 3.6799 6.47983L1.01803 4.41455Z"
        fill="#FBBC05"
      />
      <path
        d="M8.15982 3.18545C9.33802 3.18545 10.3853 3.59271 11.2216 4.37818L13.5125 2.0873C12.1234 0.792777 10.3199 0 8.15982 0C5.03257 0 2.33443 1.79636 1.01807 4.41455L3.67985 6.48001C4.31254 4.58908 6.07983 3.18545 8.15982 3.18545Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function IconGitHub({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("size-4", className)}
      fill="currentColor"
      {...props}
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export function IconX({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("size-4", className)}
      fill="currentColor"
      {...props}
    >
      <path d="M9.52217 6.77491L15.4785 0H14.0671L8.89516 5.88256L4.76437 0H0L6.24656 8.89547L0 16H1.41155L6.87321 9.78782L11.2356 16H16L9.52183 6.77491H9.52217ZM7.58887 8.97384L6.95596 8.08805L1.92015 1.03974H4.0882L8.15216 6.72795L8.78507 7.61374L14.0677 15.0075H11.8997L7.58887 8.97418V8.97384Z" />
    </svg>
  );
}

export function IconLinkedIn({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("size-4", className)}
      fill="currentColor"
      {...props}
    >
      <path fillRule="evenodd" clipRule="evenodd" d="M3.5 2C2.67157 2 2 2.67157 2 3.5V12.5C2 13.3284 2.67157 14 3.5 14H12.5C13.3284 14 14 13.3284 14 12.5V3.5C14 2.67157 13.3284 2 12.5 2H3.5ZM4.74556 5.5C5.21057 5.5 5.5 5.16665 5.5 4.75006C5.49133 4.3241 5.21057 4 4.75438 4C4.29824 4 4 4.3241 4 4.75006C4 5.16665 4.28937 5.5 4.73687 5.5H4.74556ZM5.5 6.5V12H4V6.5H5.5ZM7 12H8.5V8.89479C8.5 8.89479 8.60415 7.78962 9.55208 7.78962C10.5 7.78962 10.5 9.02275 10.5 9.02275V12H12V8.8133C12 7.13837 11.25 6.5025 10.125 6.5025C9 6.5025 8.5 7.27778 8.5 7.27778V6.5025H7.00005C7.02383 7.01418 7 12 7 12Z" />
    </svg>
  );
}

/* ── Navigation ── */

export function IconArrowRight({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      className={cn("size-4", className)}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.53033 2.21968L9 1.68935L7.93934 2.75001L8.46967 3.28034L12.4393 7.25001H1.75H1V8.75001H1.75H12.4393L8.46967 12.7197L7.93934 13.25L9 14.3107L9.53033 13.7803L14.6036 8.70711C14.9941 8.31659 14.9941 7.68342 14.6036 7.2929L9.53033 2.21968Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconArrowUp({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("size-4", className)}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.70711 1.39644C8.31659 1.00592 7.68342 1.00592 7.2929 1.39644L2.21968 6.46966L1.68935 6.99999L2.75001 8.06065L3.28034 7.53032L7.25001 3.56065V14.25V15H8.75001V14.25V3.56065L12.7197 7.53032L13.25 8.06065L14.3107 6.99999L13.7803 6.46966L8.70711 1.39644Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconChevronLeft({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("size-4", className)}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.5 14.0607L9.96966 13.5303L5.14644 8.7071C4.75592 8.31658 4.75592 7.68341 5.14644 7.29289L9.96966 2.46966L10.5 1.93933L11.5607 2.99999L11.0303 3.53032L6.56065 7.99999L11.0303 12.4697L11.5607 13L10.5 14.0607Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconChevronRight({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("size-4", className)}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.50001 1.93933L6.03034 2.46966L10.8536 7.29288C11.2441 7.68341 11.2441 8.31657 10.8536 8.7071L6.03034 13.5303L5.50001 14.0607L4.43935 13L4.96968 12.4697L9.43935 7.99999L4.96968 3.53032L4.43935 2.99999L5.50001 1.93933Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconChevronDown({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("size-4", className)}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.0607 5.49999L13.5303 6.03032L8.7071 10.8535C8.31658 11.2441 7.68341 11.2441 7.29289 10.8535L2.46966 6.03032L1.93933 5.49999L2.99999 4.43933L3.53032 4.96966L7.99999 9.43933L12.4697 4.96966L13 4.43933L14.0607 5.49999Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconChevronLeftSmall({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("size-4", className)}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.24996 12.0607L8.71963 11.5303L5.89641 8.7071C5.50588 8.31657 5.50588 7.68341 5.89641 7.29288L8.71963 4.46966L9.24996 3.93933L10.3106 4.99999L9.78029 5.53032L7.31062 7.99999L9.78029 10.4697L10.3106 11L9.24996 12.0607Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconChevronRightSmall({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("size-4", className)}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.74999 3.93933L7.28032 4.46966L10.1035 7.29288C10.4941 7.68341 10.4941 8.31657 10.1035 8.7071L7.28032 11.5303L6.74999 12.0607L5.68933 11L6.21966 10.4697L8.68933 7.99999L6.21966 5.53032L5.68933 4.99999L6.74999 3.93933Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconChevronDownSmall({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("size-4", className)}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.0607 6.74999L11.5303 7.28032L8.7071 10.1035C8.31657 10.4941 7.68341 10.4941 7.29288 10.1035L4.46966 7.28032L3.93933 6.74999L4.99999 5.68933L5.53032 6.21966L7.99999 8.68933L10.4697 6.21966L11 5.68933L12.0607 6.74999Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconChevronUpDown({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("size-4", className)}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.7071 2.39644C8.31658 2.00592 7.68341 2.00592 7.29289 2.39644L4.46966 5.21966L3.93933 5.74999L4.99999 6.81065L5.53032 6.28032L7.99999 3.81065L10.4697 6.28032L11 6.81065L12.0607 5.74999L11.5303 5.21966L8.7071 2.39644ZM5.53032 9.71966L4.99999 9.18933L3.93933 10.25L4.46966 10.7803L7.29289 13.6035C7.68341 13.9941 8.31658 13.9941 8.7071 13.6035L11.5303 10.7803L12.0607 10.25L11 9.18933L10.4697 9.71966L7.99999 12.1893L5.53032 9.71966Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ── Actions ── */

export function IconSearch({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("size-4", className)}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.5 6.5C1.5 3.73858 3.73858 1.5 6.5 1.5C9.26142 1.5 11.5 3.73858 11.5 6.5C11.5 9.26142 9.26142 11.5 6.5 11.5C3.73858 11.5 1.5 9.26142 1.5 6.5ZM6.5 0C2.91015 0 0 2.91015 0 6.5C0 10.0899 2.91015 13 6.5 13C8.02469 13 9.42677 12.475 10.5353 11.596L13.9697 15.0303L14.5 15.5607L15.5607 14.5L15.0303 13.9697L11.596 10.5353C12.475 9.42677 13 8.02469 13 6.5C13 2.91015 10.0899 0 6.5 0Z"
      />
    </svg>
  );
}

export function IconClose({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("size-4", className)}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.4697 13.5303L13 14.0607L14.0607 13L13.5303 12.4697L9.06066 8L13.5303 3.53033L14.0607 3L13 1.93934L12.4697 2.46967L8 6.93934L3.53033 2.46967L3 1.93934L1.93934 3L2.46967 3.53033L6.93934 8L2.46967 12.4697L1.93934 13L3 14.0607L3.53033 13.5303L8 9.06066L12.4697 13.5303Z"
      />
    </svg>
  );
}

export function IconCheck({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("size-4", className)}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M15.5607 3.99999L15.0303 4.53032L6.23744 13.3232C5.55403 14.0066 4.44599 14.0066 3.76257 13.3232L4.2929 12.7929L3.76257 13.3232L0.969676 10.5303L0.439346 9.99999L1.50001 8.93933L2.03034 9.46966L4.82323 12.2626C4.92086 12.3602 5.07915 12.3602 5.17678 12.2626L13.9697 3.46966L14.5 2.93933L15.5607 3.99999Z"
      />
    </svg>
  );
}

export function IconPlus({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16.001"
      fill="currentColor"
      className={cn("size-4", className)}
      {...props}
    >
      <path
        d="M7.078,0V7.077H0V8.923H7.078V16H8.924V8.923H16V7.077H8.924V0Z"
        transform="translate(0 0)"
      />
    </svg>
  );
}

export function IconMinus({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("size-4", className)}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2 7.25H2.75H13.25H14V8.75H13.25H2.75H2V7.25Z"
      />
    </svg>
  );
}

export function IconCopy({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-4", className)}
      {...props}
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

export function IconFilter({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("size-4", className)}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 2.75C1 2.33579 1.33579 2 1.75 2H14.25C14.6642 2 15 2.33579 15 2.75V4.38197C15 4.51458 14.9473 4.64175 14.8536 4.73551L10.25 9.33911V13.25C10.25 13.5299 10.0834 13.7832 9.82617 13.894L6.82617 15.144C6.6051 15.2363 6.35268 15.2208 6.14478 15.1027C5.93689 14.9847 5.80002 14.7793 5.75 14.5V9.33911L1.14645 4.73551C1.05268 4.64175 1 4.51458 1 4.38197V2.75Z"
      />
    </svg>
  );
}

export function IconSettingsSlider({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("size-4", className)}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.75 5.5C11.7165 5.5 12.5 4.7165 12.5 3.75C12.5 2.7835 11.7165 2 10.75 2C9.7835 2 9 2.7835 9 3.75C9 4.7165 9.7835 5.5 10.75 5.5ZM10.75 0.75C12.1479 0.75 13.3225 1.70608 13.6555 3H15.25H16V4.5H15.25H13.6555C13.3225 5.79392 12.1479 6.75 10.75 6.75C9.35212 6.75 8.17754 5.79392 7.84451 4.5H0.75H0V3H0.75H7.84451C8.17754 1.70608 9.35212 0.75 10.75 0.75ZM15.25 13H16V11.5H15.25L8.15549 11.5C7.82245 10.2061 6.64788 9.25 5.25 9.25C3.85212 9.25 2.67755 10.2061 2.34451 11.5H0.75H0V13H0.75H2.34451C2.67755 14.2939 3.85212 15.25 5.25 15.25C6.64788 15.25 7.82246 14.2939 8.15549 13L15.25 13ZM7 12.2513C7 12.2509 7 12.2504 7 12.25C7 12.2496 7 12.2491 7 12.2487C6.99929 11.2828 6.21606 10.5 5.25 10.5C4.2835 10.5 3.5 11.2835 3.5 12.25C3.5 13.2165 4.2835 14 5.25 14C6.21606 14 6.99929 13.2172 7 12.2513Z"
      />
    </svg>
  );
}

/* ── Layout ── */

export function IconBox({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      className={cn("size-4", className)}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 0.154663L8.34601 0.334591L14.596 3.58459L15 3.79466V4.25V11.75V12.2053L14.596 12.4154L8.34601 15.6654L8 15.8453L7.65399 15.6654L1.40399 12.4154L1 12.2053V11.75V4.25V3.79466L1.40399 3.58459L7.65399 0.334591L8 0.154663ZM2.5 11.2947V5.44058L7.25 7.81559V13.7647L2.5 11.2947ZM8.75 13.7647L13.5 11.2947V5.44056L8.75 7.81556V13.7647ZM8 1.84534L12.5766 4.22519L7.99998 6.51352L3.42335 4.2252L8 1.84534Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconInbox({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      className={cn("size-4", className)}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.67705 7.5L3.92705 3H12.0729L14.3229 7.5H10H9.25V8.25C9.25 8.94036 8.69036 9.5 8 9.5C7.30964 9.5 6.75 8.94036 6.75 8.25V7.5H6H1.67705ZM1.5 9V12C1.5 12.5523 1.94772 13 2.5 13H13.5C14.0523 13 14.5 12.5523 14.5 12V9H10.6465C10.32 10.1543 9.25878 11 8 11C6.74122 11 5.67998 10.1543 5.35352 9H1.5ZM3 1.5H13L15.8944 7.28885C15.9639 7.42771 16 7.58082 16 7.73607V12C16 13.3807 14.8807 14.5 13.5 14.5H2.5C1.11929 14.5 0 13.3807 0 12V7.73607C0 7.58082 0.0361451 7.42771 0.105573 7.28885L3 1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function IconClockRewind({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      className={cn("size-4", className)}
      {...props}
    >
      <path d="M7.987 13.667a5.65 5.65 0 0 1-3.779-1.428 5.85 5.85 0 0 1-1.857-3.578h1.022a4.87 4.87 0 0 0 1.557 2.868 4.72 4.72 0 0 0 3.057 1.138c1.301 0 2.404-.453 3.311-1.36.907-.908 1.361-2.01 1.361-3.307s-.454-2.399-1.361-3.306c-.907-.907-2.01-1.361-3.311-1.361a4.92 4.92 0 0 0-2.05.486 5.08 5.08 0 0 0-1.647 1.337h1.747v1H2.659V2.773h1.001v1.582A6.08 6.08 0 0 1 5.598 2.87 5.73 5.73 0 0 1 7.987 2.34c.788 0 1.525.149 2.213.449.687.298 1.287.703 1.8 1.215.512.512.917 1.112 1.215 1.8.298.688.447 1.425.447 2.213s-.149 1.525-.447 2.213a5.73 5.73 0 0 1-1.215 1.8 5.73 5.73 0 0 1-1.8 1.215c-.688.298-1.425.447-2.213.447v-.025zm2.004-2.965l-2.485-2.485V4.673h1v3.136l2.189 2.189-.704.704z" />
    </svg>
  );
}

export function IconActivity({
  className,
  ...props
}: React.ComponentProps<"svg">) {
  return (
    <svg
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      className={cn("size-4", className)}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.51324 3.62367L3.76375 8.34731C3.61845 8.7396 3.24433 8.99999 2.826 8.99999H0.75H0V7.49999H0.75H2.47799L4.56666 1.86057C4.88684 0.996097 6.10683 0.988493 6.43776 1.84891L10.5137 12.4463L12.2408 8.1286C12.3926 7.74894 12.7604 7.49999 13.1693 7.49999H15.25H16V8.99999H15.25H13.5078L11.433 14.1868C11.0954 15.031 9.8976 15.023 9.57122 14.1744L5.51324 3.62367Z"
        fill="currentColor"
      />
    </svg>
  );
}
