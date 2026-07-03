import { useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';

export const SAVE_VERSIONED_OBJECT_MUTATION = gql`
  mutation SaveVersionedObject($objectNameSingular: String!, $id: UUID!, $data: JSON!) {
    saveVersionedObject(objectNameSingular: $objectNameSingular, id: $id, data: $data) {
      id
      version
      isLatest
      rootVersionId
    }
  }
`;

export type SaveVersionedObjectResult = {
  id: string;
  version: number;
  isLatest: boolean;
  rootVersionId: string;
};

type SaveVersionedObjectVariables = {
  objectNameSingular: string;
  id: string;
  data: Record<string, unknown>;
};

export const useSaveVersionedObject = () => {
  const [mutate] = useMutation<
    { saveVersionedObject: SaveVersionedObjectResult },
    SaveVersionedObjectVariables
  >(SAVE_VERSIONED_OBJECT_MUTATION);

  const saveVersionedObject = async (
    objectNameSingular: string,
    id: string,
    data: Record<string, unknown>,
  ) => {
    const result = await mutate({
      variables: { objectNameSingular, id, data },
    });

    return result.data?.saveVersionedObject;
  };

  return { saveVersionedObject };
};
