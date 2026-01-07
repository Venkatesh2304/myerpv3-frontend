import { EditView, EditViewHeader } from "@/components/refine-ui/views/edit-view";
import { EditViewFooter } from "@/components/refine-ui/views/edit-view-footer";
import { ChequeForm } from "./form";

export const ChequeEdit = () => {
  return (
    <EditView>
      <EditViewHeader title="" />
      <ChequeForm footer={<EditViewFooter />} />
    </EditView>
  );
};