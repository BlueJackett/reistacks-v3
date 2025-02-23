import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSignUpStore } from "@/stores/useSignUpStore";
import { Loader2 } from "lucide-react";

function Step4 ( {
  onSubmit,
  loading,
}: {
  onSubmit: () => void;
  loading: boolean;
} )
{
  const { formData, setFormData, prevStep } = useSignUpStore();

  const handleFileChange = ( e: React.ChangeEvent<HTMLInputElement> ) =>
  {
    if ( e.target.files )
    {
      setFormData( { leads: e.target.files[ 0 ] } );
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-6">Upload Lead List</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="leads">Upload CSV</Label>
          <Input
            id="leads"
            type="file"
            accept=".csv"
            onChange={ handleFileChange }
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={ prevStep } variant="outline" className="w-full">
            Back
          </Button>
          <Button onClick={ onSubmit } className="w-full" disabled={ loading }>
            { loading ? <Loader2 className="animate-spin" /> : 'Submit' }
          </Button>
        </div>
      </div>
    </>
  );
}