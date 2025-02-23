import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSignUpStore } from "@/stores/useSignUpStore";
import { Key, ReactElement, JSXElementConstructor, ReactNode, ReactPortal, useState } from "react";

export default function Step3 ()
{
  const { formData, setFormData, nextStep, prevStep } = useSignUpStore();
  const [ vaEmail, setVaEmail ] = useState( '' );

  const handleAddVa = () =>
  {
    if ( vaEmail && !formData.vas.includes( vaEmail ) )
    {
      setFormData( { vas: [ ...formData.vas, vaEmail ] } );
      setVaEmail( '' );
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold mb-6">Invite Virtual Assistants</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="vaEmail">VA Email</Label>
          <div className="flex gap-2">
            <Input
              id="vaEmail"
              type="email"
              value={ vaEmail }
              onChange={ ( e ) => setVaEmail( e.target.value ) }
              placeholder="Enter VA email"
            />
            <Button onClick={ handleAddVa }>Add</Button>
          </div>
        </div>
        <div>
          { formData.vas.map( ( email: string ) => (
            <div key={ email } className="flex items-center justify-between">
              <span>{ email }</span>
              <Button
                variant="ghost"
                onClick={ () =>
                  setFormData( {
                    vas: formData.vas.filter( ( e ) => e !== email ),
                  } )
                }
              >
                Remove
              </Button>
            </div>
          ) ) }
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