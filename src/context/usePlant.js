import { useContext } from "react";
import { PlantContext } from "./context";

export function usePlant() {
    const context = useContext(PlantContext);
    if (!context) {
        throw new Error("usePlant must be used within a PlantProvider");
    }
    return context;
}

export default usePlant;
