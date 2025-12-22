import { useForm } from "@refinedev/react-hook-form";
import { Form } from "@/components/ui/form";
import type { Cheque } from "@/pages/cheque/types";
import { useNotificationProvider } from "@/components/refine-ui/notification/use-notification-provider";
import { CollectionEntries, validateCollectionEntries } from "@/components/custom/collectionentires";
import { ChequeDetailsCard } from "./components/cheque-details-card";
import { useCompany } from "@/providers/company-provider";

interface ChequeFormProps {
  footer?: React.ReactNode;
}

export const ChequeForm = ({ footer }: ChequeFormProps) => {
  const notification = useNotificationProvider();
  const { company } = useCompany();
  const form = useForm<Cheque>({
    refineCoreProps: {},
  });
  const {
    refineCore: { onFinish },
    handleSubmit,
    setError,
  } = form;

  function onSubmit(values: Cheque) {
    const collections = values?.collection || [];
    const total = values?.amt || 0;
    const validation = validateCollectionEntries(total, collections, 50);
    if (!validation.isValid) {
      notification.open({
        type: "error",
        message: validation.message || "Validation failed",
      })

      // Set form error
      setError("root", {
        type: "manual",
        message: validation.message || "Validation failed",
      });

      return;
    }
    onFinish({ company: company?.id, ...values });
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
        <ChequeDetailsCard />
        <CollectionEntries />
        {/* Render footer inside form */}
        {footer}
      </form>
    </Form>

  );
};
