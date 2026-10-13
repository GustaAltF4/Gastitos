import { useState } from "react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"


import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog"

import { Heart, Copy, CopyCheck } from "lucide-react"

export function DialogDona() {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);


    const copiarAlias = () => {
        navigator.clipboard.writeText("gusta.acosta");

        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };




    return (
        <Dialog open={open} onOpenChange={setOpen}>

            <DialogTrigger asChild>
                <Button

                    className="bg-[#5A4FFF] hover:bg-[#7268FF]  px-5 py-2 rounded-full flex items-center gap-2 text-sm shadow-md transition">
                    <Heart className="h-4 w-4" />
                    Donar
                </Button>
            </DialogTrigger>
            <DialogTitle className="hidden"></DialogTitle>
            <DialogDescription className="hidden"></DialogDescription>
            <DialogContent className="sm:max-w-[400px] bg-zinc-300 dark:bg-zinc-800">

                <div className="mt-6 w-full max-w-md flex flex-col gap-3">

                    <h2 className="text-xl font-semibold  text-center">Si te gustó la app, podés ayudarme con una donación. Gracias 😁</h2>

                    <Button
                        className="bg-blue-800 hover:bg-blue-600  font-semibold py-3 rounded-none text-xl"
                        onClick={() => window.open("http://link.mercadopago.com.ar/gustaaltf4", "_blank")}
                    >
                        💙 Donar 💙
                    </Button>

                    <p className=" mt-2 mb-0">Alias de Mercado Pago:</p>

                    <div className="flex items-center justify-between bg-neutral-900 text-white rounded-none px-3 py-2">
                        <span className="font-mono">gusta.acosta</span>
                        <Button
                            onClick={copiarAlias} className={`flex items-center gap-2 transition-all cursor-pointer
                                    ${copied
                                    ? "bg-zinc-500 hover:bg-zinc-500  cursor-default scale-95"
                                    : " "}
                                `}>
                            {copied ? <CopyCheck /> : <Copy />}

                        </Button>
                    </div>
                </div>


                {/* Botones */}
                <div className="flex flex-col gap-2 mt-4  ">

                    <Button
                        className="  rounded-none"
                        type="button"
                        onClick={() => setOpen(false)}
                        
                    >
                        Cerrar
                    </Button>

                </div>

            </DialogContent>
        </Dialog>
    )
}
