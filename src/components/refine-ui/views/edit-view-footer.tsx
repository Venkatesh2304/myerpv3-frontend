import { DeleteButton } from "@/components/refine-ui/buttons/delete";
import { Button } from "@/components/ui/button";
import { useResourceParams, useBack } from "@refinedev/core";
import { useFormContext } from "react-hook-form";

interface EditViewFooterProps {
  saveButtonText?: string;
}

export function EditViewFooter({
  saveButtonText = "Save",
}: EditViewFooterProps) {
  const { resource, identifier, id: recordItemId } = useResourceParams();
  const resourceName = resource?.name ?? identifier;
  const { formState: { isSubmitting } } = useFormContext();
  const back = useBack();

  const handleDeleteSuccess = () => {
    back();
  };

  return (
    <div className="flex items-center justify-between border-t pt-6">
      <div>
        <DeleteButton 
          resource={resourceName} 
          recordItemId={recordItemId} 
          type="button"
          onSuccess={handleDeleteSuccess}
        />
      </div>
      <div>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : saveButtonText}
        </Button>
      </div>
    </div>
  );
}
