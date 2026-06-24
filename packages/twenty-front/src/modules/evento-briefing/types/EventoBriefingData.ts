export type EventoBriefingNote = {
  nombre: string;
  tipoLabel: string;
  comentario: string;
  createdBy: string;
};

export type EventoBriefingDistribuidor = {
  name: string;
  propietario: string | null;
  directorGeneral: string | null;
  directorComercial: string | null;
  clipperMan: string | null;
  respCanalOrganizado: string | null;
  infoCreditoObtenida: boolean | null;
  direccion: string;
};

export type EventoBriefingPais = {
  name: string;
  poblacion: number | null;
  porcentajeFumadores: number | null;
  numeroFumadores: number | null;
  turismoInterior: number | null;
  turistasOtrosPaises: number | null;
};

export type EventoBriefingData = {
  generatedAt: string;
  evento: {
    name: string;
    tipoEventoLabel: string;
    numeroEventoAnio: number | null;
    fechaPrevista: string | null;
    fechaAnterior: string | null;
    fechaReunionPrevia: string | null;
    participantesClipper: string | null;
  };
  distribuidor: EventoBriefingDistribuidor | null;
  pais: EventoBriefingPais | null;
  performances: { id: string; name: string }[];
  notes: EventoBriefingNote[];
  objectives: EventoBriefingNote[];
};
