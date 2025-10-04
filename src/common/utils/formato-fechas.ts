// Función para obtener la fecha actual en UTC considerando Guatemala (UTC-6)
export const fechaUTC = (): Date => {
    const ahora = new Date();
    // Guatemala está en UTC-6, entonces agregamos 6 horas para obtener UTC
    const guatemalaEnUTC = new Date(ahora.getTime() - (6 * 60 * 60 * 1000));
    return guatemalaEnUTC;
};