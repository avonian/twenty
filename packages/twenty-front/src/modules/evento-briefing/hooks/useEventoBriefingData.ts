import { isDefined } from 'twenty-shared/utils';

import { EVENTO_BRIEFING_OBJECT_NAME_SINGULAR } from '@/evento-briefing/constants/EventoBriefingObjectNameSingular';
import { type EventoBriefingData } from '@/evento-briefing/types/EventoBriefingData';
import { useEventoRelatedNotes } from '@/load-related-notes/hooks/useEventoRelatedNotes';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';

type AddressValue = {
  addressStreet1: string | null;
  addressStreet2: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressPostcode: string | null;
  addressCountry: string | null;
} | null;

type DistribuidorRecord = {
  __typename: string;
  id: string;
  name: string | null;
  propietario: string | null;
  directorGeneral: string | null;
  directorComercial: string | null;
  clipperMan: string | null;
  respCanalOrganizado: string | null;
  infoCreditoObtenida: boolean | null;
  direccion: AddressValue;
} | null;

type PaisRecord = {
  __typename: string;
  id: string;
  name: string | null;
  poblacion: number | null;
  porcentajeFumadores: number | null;
  numeroFumadores: number | null;
  turismoInterior: number | null;
  turistasOtrosPaises: number | null;
} | null;

type EventoRecord = {
  __typename: string;
  id: string;
  name: string | null;
  tipoEvento: string | null;
  numeroEventoAnio: number | null;
  fechaPrevista: string | null;
  fechaAnterior: string | null;
  fechaReunionPrevia: string | null;
  participantesClipper: string | null;
  distribuidor: DistribuidorRecord;
  pais: PaisRecord;
};

type PerformanceRecord = {
  __typename: string;
  id: string;
  name: string | null;
};

const formatAddress = (address: AddressValue): string => {
  if (!isDefined(address)) {
    return '';
  }

  const cityLine = [address.addressPostcode, address.addressCity]
    .filter((part) => isDefined(part) && part !== '')
    .join(' ');

  return [
    address.addressStreet1,
    address.addressStreet2,
    cityLine,
    address.addressState,
    address.addressCountry,
  ]
    .filter((part) => isDefined(part) && part !== '')
    .join(', ');
};

// Gathers everything the Evento briefing PDF needs: the evento's own fields, its
// distribuidor and país (one query, depth 1), the distribuidor's performances,
// and the notes pulled onto the evento — shaped into a flat, print-ready object.
export const useEventoBriefingData = (
  eventoId: string,
): { data: EventoBriefingData | null; isReady: boolean } => {
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: EVENTO_BRIEFING_OBJECT_NAME_SINGULAR,
  });

  const tipoEventoOptions =
    objectMetadataItem.fields.find((field) => field.name === 'tipoEvento')
      ?.options ?? [];

  const { record: evento, loading: loadingEvento } =
    useFindOneRecord<EventoRecord>({
      objectNameSingular: EVENTO_BRIEFING_OBJECT_NAME_SINGULAR,
      objectRecordId: eventoId,
      recordGqlFields: {
        id: true,
        name: true,
        tipoEvento: true,
        numeroEventoAnio: true,
        fechaPrevista: true,
        fechaAnterior: true,
        fechaReunionPrevia: true,
        participantesClipper: true,
        distribuidor: {
          id: true,
          name: true,
          propietario: true,
          directorGeneral: true,
          directorComercial: true,
          clipperMan: true,
          respCanalOrganizado: true,
          infoCreditoObtenida: true,
          direccion: {
            addressStreet1: true,
            addressStreet2: true,
            addressCity: true,
            addressState: true,
            addressPostcode: true,
            addressCountry: true,
          },
        },
        pais: {
          id: true,
          name: true,
          poblacion: true,
          porcentajeFumadores: true,
          numeroFumadores: true,
          turismoInterior: true,
          turistasOtrosPaises: true,
        },
      },
    });

  const distribuidorId = evento?.distribuidor?.id;

  const { records: performances, loading: loadingPerformances } =
    useFindManyRecords<PerformanceRecord>({
      objectNameSingular: 'performance',
      filter: { distribuidorId: { eq: distribuidorId ?? '' } },
      recordGqlFields: { id: true, name: true },
      skip: !isDefined(distribuidorId),
    });

  const { rows: notes, loading: loadingNotes } =
    useEventoRelatedNotes(eventoId);

  const isReady =
    isDefined(evento) &&
    !loadingEvento &&
    !loadingPerformances &&
    !loadingNotes;

  if (!isReady) {
    return { data: null, isReady: false };
  }

  const distribuidor = evento.distribuidor;
  const pais = evento.pais;

  const data: EventoBriefingData = {
    generatedAt: new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    evento: {
      name: evento.name ?? '',
      tipoEventoLabel:
        tipoEventoOptions.find((option) => option.value === evento.tipoEvento)
          ?.label ??
        evento.tipoEvento ??
        '',
      numeroEventoAnio: evento.numeroEventoAnio,
      fechaPrevista: evento.fechaPrevista,
      fechaAnterior: evento.fechaAnterior,
      fechaReunionPrevia: evento.fechaReunionPrevia,
      participantesClipper: evento.participantesClipper,
    },
    distribuidor: isDefined(distribuidor)
      ? {
          name: distribuidor.name ?? '',
          propietario: distribuidor.propietario,
          directorGeneral: distribuidor.directorGeneral,
          directorComercial: distribuidor.directorComercial,
          clipperMan: distribuidor.clipperMan,
          respCanalOrganizado: distribuidor.respCanalOrganizado,
          infoCreditoObtenida: distribuidor.infoCreditoObtenida,
          direccion: formatAddress(distribuidor.direccion),
        }
      : null,
    pais: isDefined(pais)
      ? {
          name: pais.name ?? '',
          poblacion: pais.poblacion,
          porcentajeFumadores: pais.porcentajeFumadores,
          numeroFumadores: pais.numeroFumadores,
          turismoInterior: pais.turismoInterior,
          turistasOtrosPaises: pais.turistasOtrosPaises,
        }
      : null,
    performances: performances.map((performance) => ({
      id: performance.id,
      name: performance.name ?? '',
    })),
    notes: notes.map((note) => ({
      nombre: note.nombre,
      tipoLabel: note.tipoLabel,
      comentario: note.comentario,
      createdBy: note.createdBy,
    })),
  };

  return { data, isReady: true };
};
