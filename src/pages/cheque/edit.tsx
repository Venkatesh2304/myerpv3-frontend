import { EditView, EditViewHeader } from "@/components/refine-ui/views/edit-view";
import { EditViewFooter } from "@/components/refine-ui/views/edit-view-footer";
import { ChequeForm } from "./form";

export const ChequeEdit = () => {
  return (
    <EditView>
      <EditViewHeader />
      <ChequeForm footer={<EditViewFooter />} />
    </EditView>
  );
};