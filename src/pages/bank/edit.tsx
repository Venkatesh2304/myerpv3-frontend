import { EditView, EditViewHeader } from "@/components/refine-ui/views/edit-view";
import { EditViewFooter } from "@/components/refine-ui/views/edit-view-footer";
import { BankForm } from "./form";

export const BankEdit = () => {
  return (
    <EditView>
      <EditViewHeader title=""/>
      <BankForm footer={<EditViewFooter />} />
    </EditView>
  );
};