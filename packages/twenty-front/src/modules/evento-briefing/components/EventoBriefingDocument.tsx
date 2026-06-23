// PDF document styles render via @react-pdf/renderer (not the DOM), so they
// can't use the theme's CSS variables — literal colors are required here.
/* oxlint-disable twenty/no-hardcoded-colors */
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { isDefined } from 'twenty-shared/utils';

import { type EventoBriefingData } from '@/evento-briefing/types/EventoBriefingData';

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 40,
    paddingVertical: 36,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1c1c1c',
  },
  header: { marginBottom: 18 },
  title: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#141414' },
  subtitle: { fontSize: 13, color: '#474747', marginTop: 4 },
  generated: { fontSize: 9, color: '#999999', marginTop: 4 },
  section: { marginTop: 14 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    backgroundColor: '#1961ed',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 2,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ededed',
  },
  label: { width: '38%', color: '#6b6b6b' },
  value: { width: '62%', color: '#1c1c1c' },
  muted: { color: '#999999', paddingVertical: 4 },
  listItem: { paddingVertical: 2 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f4',
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ededed',
  },
  th: { fontFamily: 'Helvetica-Bold', color: '#474747' },
  colNombre: { width: '28%', paddingRight: 4 },
  colTipo: { width: '16%', paddingRight: 4 },
  colComentario: { width: '38%', paddingRight: 4 },
  colCreador: { width: '18%' },
});

const formatText = (value: string | null) =>
  isDefined(value) && value !== '' ? value : '—';

const formatNumber = (value: number | null) =>
  isDefined(value) ? value.toLocaleString('es-ES') : '—';

const formatDate = (value: string | null) =>
  isDefined(value) && value !== ''
    ? new Date(`${value}T00:00:00`).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—';

const formatBoolean = (value: boolean | null) => {
  if (value === true) {
    return 'Sí';
  }
  if (value === false) {
    return 'No';
  }
  return '—';
};

const FieldRows = ({
  fields,
}: {
  fields: { label: string; value: string }[];
}) => (
  <>
    {fields.map((field) => (
      <View style={styles.row} key={field.label}>
        <Text style={styles.label}>{field.label}</Text>
        <Text style={styles.value}>{field.value}</Text>
      </View>
    ))}
  </>
);

type EventoBriefingDocumentProps = { data: EventoBriefingData };

export const EventoBriefingDocument = ({
  data,
}: EventoBriefingDocumentProps) => {
  const { evento, distribuidor, pais, performances, notes } = data;

  return (
    <Document title={`Briefing - ${evento.name}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Briefing de Evento</Text>
          <Text style={styles.subtitle}>{formatText(evento.name)}</Text>
          <Text style={styles.generated}>Generado el {data.generatedAt}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos del Evento</Text>
          <FieldRows
            fields={[
              {
                label: 'Tipo de Evento',
                value: formatText(evento.tipoEventoLabel),
              },
              {
                label: 'Número Evento del Año',
                value: formatNumber(evento.numeroEventoAnio),
              },
              {
                label: 'Fecha Prevista',
                value: formatDate(evento.fechaPrevista),
              },
              {
                label: 'Fecha Anterior',
                value: formatDate(evento.fechaAnterior),
              },
              {
                label: 'Fecha Reunión Previa',
                value: formatDate(evento.fechaReunionPrevia),
              },
              {
                label: 'Participantes Clipper',
                value: formatText(evento.participantesClipper),
              },
            ]}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distribuidor</Text>
          {isDefined(distribuidor) ? (
            <FieldRows
              fields={[
                { label: 'Nombre', value: formatText(distribuidor.name) },
                {
                  label: 'Propietario',
                  value: formatText(distribuidor.propietario),
                },
                {
                  label: 'Director General',
                  value: formatText(distribuidor.directorGeneral),
                },
                {
                  label: 'Director Comercial',
                  value: formatText(distribuidor.directorComercial),
                },
                {
                  label: 'Clipper Man',
                  value: formatText(distribuidor.clipperMan),
                },
                {
                  label: 'Resp. Canal Organizado',
                  value: formatText(distribuidor.respCanalOrganizado),
                },
                {
                  label: 'Dirección',
                  value: formatText(distribuidor.direccion),
                },
                {
                  label: 'Info Crédito Obtenida',
                  value: formatBoolean(distribuidor.infoCreditoObtenida),
                },
              ]}
            />
          ) : (
            <Text style={styles.muted}>Sin distribuidor asociado.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>País</Text>
          {isDefined(pais) ? (
            <FieldRows
              fields={[
                { label: 'Nombre', value: formatText(pais.name) },
                { label: 'Población', value: formatNumber(pais.poblacion) },
                {
                  label: '% Fumadores',
                  value: formatNumber(pais.porcentajeFumadores),
                },
                {
                  label: 'Número de Fumadores',
                  value: formatNumber(pais.numeroFumadores),
                },
                {
                  label: 'Turismo Interior',
                  value: formatNumber(pais.turismoInterior),
                },
                {
                  label: 'Turistas Otros Países',
                  value: formatNumber(pais.turistasOtrosPaises),
                },
              ]}
            />
          ) : (
            <Text style={styles.muted}>Sin país asociado.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performances</Text>
          {performances.length > 0 ? (
            performances.map((performance) => (
              <Text style={styles.listItem} key={performance.id}>
                • {formatText(performance.name)}
              </Text>
            ))
          ) : (
            <Text style={styles.muted}>Sin performances.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas</Text>
          {notes.length > 0 ? (
            <View>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, styles.colNombre]}>Nombre</Text>
                <Text style={[styles.th, styles.colTipo]}>Tipo</Text>
                <Text style={[styles.th, styles.colComentario]}>
                  Comentario principal
                </Text>
                <Text style={[styles.th, styles.colCreador]}>Creado por</Text>
              </View>
              {notes.map((note, index) => (
                <View style={styles.tableRow} key={`${note.nombre}-${index}`}>
                  <Text style={styles.colNombre}>
                    {formatText(note.nombre)}
                  </Text>
                  <Text style={styles.colTipo}>
                    {formatText(note.tipoLabel)}
                  </Text>
                  <Text style={styles.colComentario}>
                    {formatText(note.comentario)}
                  </Text>
                  <Text style={styles.colCreador}>
                    {formatText(note.createdBy)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.muted}>Sin notas.</Text>
          )}
        </View>
      </Page>
    </Document>
  );
};
