import { CreateView, CreateViewHeader } from "@/components/refine-ui/views/create-view";
import { CreateViewFooter } from "@/components/refine-ui/views/create-view-footer";
import { ChequeForm } from "./form";

export const ChequeCreate = () => {
  return (
    <CreateView>
      <CreateViewHeader />
      <ChequeForm footer={<CreateViewFooter />} />
    </CreateView>
  );
};