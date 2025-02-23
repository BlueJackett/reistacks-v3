import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSignUpStore } from "@/stores/useSignUpStore";

function Step1 ()
{
  const { formData, setFormData, nextStep } = useSignUpStore();

  const handleChange = ( e: React.ChangeEvent<HTMLInputElement> ) =>
  {
    setFormData( { [ e.target.name ]: e.target.value } );
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-6">Create Your Account</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={ formData.email }
            onChange={ handleChange }
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={ formData.password }
            onChange={ handleChange }
            required
          />
        </div>
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            value={ formData.name }
            onChange={ handleChange }
            required
          />
        </div>
        <Button onClick={ nextStep } className="w-full">
          Next
        </Button>
      </div>
    </>
  );
}