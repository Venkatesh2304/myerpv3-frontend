import * as React from "react"
import { Loader2 } from "lucide-react"
import { VariantProps } from "class-variance-authority"
import { Button, buttonVariants } from "@/components/ui/button"

export interface LoadingButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
    ({ children, onClick, disabled, className, ...props }, ref) => {
        const [isLoading, setIsLoading] = React.useState(false)

        const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
            if (onClick) {
                try {
                    setIsLoading(true)
                    await onClick(e)
                } finally {
                    setIsLoading(false)
                }
            }
        }

        return (
            <Button
                ref={ref}
                disabled={isLoading || disabled}
                className={className}
                onClick={handleClick}
                {...props}
            >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
            </Button>
        )
    }
)
LoadingButton.displayName = "LoadingButton"

export { LoadingButton }
