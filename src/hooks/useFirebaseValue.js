import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase";

function useFirebaseValue(path) {
    const [value, setValue] = useState(null);

    useEffect(() => {
        const dataRef = ref(database, path);

        const unsubscribe = onValue(dataRef, (snapshot) => {
            setValue(snapshot.val());
        });

        return () => unsubscribe();
    }, [path]);

    return value;
}

export default useFirebaseValue;
