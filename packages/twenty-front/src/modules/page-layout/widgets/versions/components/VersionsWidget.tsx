import { useNavigate } from 'react-router-dom';

import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useLayoutRenderingContext } from '@/ui/layout/contexts/LayoutRenderingContext';
import { H2Title } from 'twenty-ui/display';
import { Section } from 'twenty-ui/layout';

export const VersionsWidget = () => {
  const { targetRecordIdentifier } = useLayoutRenderingContext();
  const navigate = useNavigate();

  const recordId = targetRecordIdentifier?.id;
  const objectNameSingular = targetRecordIdentifier?.targetObjectNameSingular;

  const { record: currentRecord } = useFindOneRecord({
    objectNameSingular: objectNameSingular ?? '',
    objectRecordId: recordId ?? '',
    skip: !recordId || !objectNameSingular,
  });

  const rootVersionId = (currentRecord as any)?.rootVersionId;

  const { records: versionRecords, loading } = useFindManyRecords({
    objectNameSingular: objectNameSingular ?? '',
    filter: rootVersionId
      ? ({ rootVersionId: { eq: rootVersionId } } as any)
      : undefined,
    orderBy: [{ version: 'DescNullsFirst' }] as any,
    skip: !rootVersionId || !objectNameSingular,
  });

  if (!objectNameSingular || !recordId) {
    return null;
  }

  if (loading) {
    return (
      <Section>
        <H2Title title="Version History" />
        <div style={{ padding: '16px', color: 'var(--text-color-secondary)' }}>
          Loading versions...
        </div>
      </Section>
    );
  }

  if (!versionRecords || versionRecords.length === 0) {
    return (
      <Section>
        <H2Title title="Version History" />
        <div style={{ padding: '16px', color: 'var(--text-color-secondary)' }}>
          No version history available.
        </div>
      </Section>
    );
  }

  return (
    <Section>
      <H2Title title="Version History" />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '12px 0',
        }}
      >
        {versionRecords.map((version: any) => {
          const isCurrentVersion = version.id === recordId;

          return (
            <div
              key={version.id}
              onClick={() =>
                navigate(`/object/${objectNameSingular}/${version.id}`)
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: isCurrentVersion
                  ? 'var(--background-primary)'
                  : 'transparent',
                border: isCurrentVersion
                  ? '2px solid var(--border-color-brand)'
                  : '1px solid var(--border-color-light)',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: '14px',
                  }}
                >
                  v{version.version}
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-color-secondary)',
                  }}
                >
                  {new Date(version.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {isCurrentVersion && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--color-blue-50)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--background-blue)',
                  }}
                >
                  Current
                </span>
              )}
              {!version.isLatest && !isCurrentVersion && (
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-color-secondary)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--background-secondary)',
                  }}
                >
                  Previous
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
};
