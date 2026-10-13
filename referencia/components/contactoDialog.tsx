import { useState } from "react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

import { Github, Linkedin, Share2 } from "lucide-react"

export function DialogCon() {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>

            <DialogTrigger asChild>
                <Button className="p-3 rounded-full transition"
                >
                    <Share2 className="h-5 w-5 " />

                </Button>
            </DialogTrigger>
            <DialogTitle className="hidden"></DialogTitle>
            <DialogDescription className="hidden"></DialogDescription>
            <DialogContent className="sm:max-w-[400px] bg-zinc-300 dark:bg-zinc-800">


                <div className="flex gap-4 mt-2">
                    <Label className="">Código desarrollado por:</Label>
                    <Button onClick={() => window.open("https://www.linkedin.com/in/gustavo-altf4/", "_blank")}><Linkedin /></Button>
                    <Button onClick={() => window.open("https://github.com/GustaAltF4", "_blank")}><Github /></Button>
                </div>

                <Label>Y si tienes alguna sugerencia para mejorar el sitio:</Label>
                <a rel="stylesheet" href="mailto:acostag.123456@gmail.com"
                    className="text-blue-500 hover:text-blue-700 hover:underline text-center">Escribime aquí</a>

                <Label>Si quieres que el sitio se descargue como una app en tu dispositivo:</Label>
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger className="bg-zinc-950 rounded-none pl-2 pr-2">
                            <div className="flex items-center"> 
                                <span className="text-[#95cf00]">Android </span>
                                <img src="android.svg" alt="android" className="h-5 " />
                            </div>
                           
                           
                            
                            </AccordionTrigger>
                        <AccordionContent className=" pl-2 pr-2 bg-zinc-950 text-[#95cf00] ">

                            <br />
                            <div className="flex items-center gap-2">
                                <span>1 -Tocá los tres puntitos.</span>
                                <img src="3puntosA.png" alt="more" className="h-5 inline-block" />
                            </div>
                            <span className="ml-4">(Arriba a la derecha)</span><br /><br />

                            <div className="flex items-center gap-2">
                                <span> 2 -Elegí “Agregar a pantalla principal”.</span>
                                <img src="agregarP.png" alt="more" className="h-5 inline-block" />
                            </div>


                            <br />

                            3 -Confirmá.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2">
                        <AccordionTrigger className="bg-zinc-950 rounded-none pl-2 pr-2">
                            <div className="flex items-center text-white "> <span>IOS </span>
                                <img src="apple.svg" alt="apple" className="h-5 " />
                            </div>
                            </AccordionTrigger>
                        <AccordionContent className=" pl-2 pr-2 bg-zinc-950 text-white ">
                            <br />
                            <div className="flex items-center gap-2">
                                <span>1 -Tocá los tres puntitos.</span>
                                <img src="3puntosA.png" alt="more" className="h-5 inline-block rotate-90" />
                            </div>
                            <br />
                            <div className="flex items-center gap-2">
                                <span> 2 -Tocá Compartir.</span>
                                <img src="comp.png" alt="more" className="h-5 inline-block" />
                            </div>

                            <br />

                            <span>3 -Bajá y seleccioná “Agregar a pantalla de inicio”.</span>
                            <br /><br />
                            <span>4- Tocá “Agregar”.</span>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

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
