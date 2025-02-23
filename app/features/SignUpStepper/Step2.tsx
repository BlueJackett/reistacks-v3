import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSignUpStore } from "@/stores/useSignUpStore";

function Step2 ()
{
  const { formData, setFormData, nextStep, prevStep } = useSignUpStore();

  const handleChange = ( e: React.ChangeEvent<HTMLInputElement> ) =>
  {
    setFormData( { [ e.target.name ]: e.target.value } );
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-6">Set Organization Details</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="organizationName">Organization Name</Label>
          <Input
            id="organizationName"
            name="organizationName"
            type="text"
            value={ formData.organizationName }
            onChange={ handleChange }
            required
          />
        </div>
        <div>
          <Label htmlFor="subdomain">Subdomain</Label>
          <Input
            id="subdomain"
            name="subdomain"
            type="text"
            value={ formData.subdomain }
            onChange={ handleChange }
            required
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={ prevStep } variant="outline" className="w-full">
            Back
          </Button>
          <Button onClick={ nextStep } className="w-full">
            Next
          </Button>
        </div>
      </div>
    </>
  );
}