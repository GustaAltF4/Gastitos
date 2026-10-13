import { ModeToggle } from "@/components/mode-toggle";
import { DialogDona } from "@/components/donacionDialog";
import { DialogCon } from "@/components/contactoDialog";

export function Menu() {
  return (
    <nav className="w-full flex items-center justify-between px-4 py-3 ">
      
      {/* --- IZQUIERDA: ICONOS REDONDOS --- */}
      <div className="flex items-center gap-3">
        {/* Botón compartir */}
        <DialogCon />

        {/* Botón modo oscuro / claro */}
        <ModeToggle/>
      </div>

      {/* --- DERECHA: BOTÓN DONAR --- */}
      
        <DialogDona />
        
    
    </nav>
  );
}
