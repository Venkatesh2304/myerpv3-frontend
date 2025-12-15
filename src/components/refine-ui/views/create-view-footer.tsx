import { Button } from "@/components/ui/button";
import { useFormContext } from "react-hook-form";

interface CreateViewFooterProps {
  saveButtonText?: string;
}

export function CreateViewFooter({
  saveButtonText = "Create",
}: CreateViewFooterProps) {
  const { formState: { isSubmitting } } = useFormContext();
  return (
    <div className="flex items-center justify-end border-t pt-6">
      <Button
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Creating..." : saveButtonText}
      </Button>
    </div>
  );
}
