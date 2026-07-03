DO $$
DECLARE
  v_workspace_id uuid := '24fdc2a1-854b-4cbd-bee7-f879aa5b491e';
  v_object_id uuid := 'c30f65b1-4800-4ed5-895f-97aca04537a6';
  v_app_id uuid := '2ffb247f-35e3-46a6-a9a4-23ed3ffdc952';
  v_page_layout_id uuid := '55326059-1a8c-4156-9920-38ff2e3543a0';
  v_workspace_schema text := 'workspace_26u7bbo45dl6cjx83ysbzxogu';
  v_tab_id uuid;
  v_widget_id uuid;
BEGIN

  -- 0. Add VERSIONS to the widget type enum if not present
  ALTER TYPE core."pageLayoutWidget_type_enum" ADD VALUE IF NOT EXISTS 'VERSIONS';

  -- 1. Field: version (NUMBER, NOT NULL, default 1, system=true)
  INSERT INTO core."fieldMetadata" (id, "universalIdentifier", "objectMetadataId", type, name, label, "defaultValue", icon, "isActive", "isSystem", "isNullable", "isUIEditable", "isUIReadOnly", "isLabelSyncedWithName", "workspaceId", "applicationId")
  VALUES (gen_random_uuid(), gen_random_uuid(), v_object_id, 'NUMBER', 'version', 'Version', '1', 'IconNumber', true, true, false, false, true, false, v_workspace_id, v_app_id);

  -- 2. Field: isLatest (BOOLEAN, NOT NULL, default true, system=true)
  INSERT INTO core."fieldMetadata" (id, "universalIdentifier", "objectMetadataId", type, name, label, "defaultValue", icon, "isActive", "isSystem", "isNullable", "isUIEditable", "isUIReadOnly", "isLabelSyncedWithName", "workspaceId", "applicationId")
  VALUES (gen_random_uuid(), gen_random_uuid(), v_object_id, 'BOOLEAN', 'isLatest', 'Is Latest', 'true', 'IconCheck', true, true, false, false, true, false, v_workspace_id, v_app_id);

  -- 3. Field: previousVersionId (UUID, nullable, system=true)
  INSERT INTO core."fieldMetadata" (id, "universalIdentifier", "objectMetadataId", type, name, label, icon, "isActive", "isSystem", "isNullable", "isUIEditable", "isUIReadOnly", "isLabelSyncedWithName", "workspaceId", "applicationId")
  VALUES (gen_random_uuid(), gen_random_uuid(), v_object_id, 'UUID', 'previousVersionId', 'Previous Version', 'IconArrowBackUp', true, true, true, false, true, false, v_workspace_id, v_app_id);

  -- 4. Field: rootVersionId (UUID, NOT NULL, system=true)
  INSERT INTO core."fieldMetadata" (id, "universalIdentifier", "objectMetadataId", type, name, label, icon, "isActive", "isSystem", "isNullable", "isUIEditable", "isUIReadOnly", "isLabelSyncedWithName", "workspaceId", "applicationId")
  VALUES (gen_random_uuid(), gen_random_uuid(), v_object_id, 'UUID', 'rootVersionId', 'Root Version', 'IconHierarchy', true, true, false, false, true, false, v_workspace_id, v_app_id);

  -- 5. ALTER TABLE: add columns
  EXECUTE format('ALTER TABLE %I._performance ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1', v_workspace_schema);
  EXECUTE format('ALTER TABLE %I._performance ADD COLUMN IF NOT EXISTS "isLatest" BOOLEAN NOT NULL DEFAULT true', v_workspace_schema);
  EXECUTE format('ALTER TABLE %I._performance ADD COLUMN IF NOT EXISTS "previousVersionId" uuid', v_workspace_schema);
  EXECUTE format('ALTER TABLE %I._performance ADD COLUMN IF NOT EXISTS "rootVersionId" uuid', v_workspace_schema);

  -- 6. UPDATE existing records: version=1, isLatest=true, rootVersionId=id
  EXECUTE format('UPDATE %I._performance SET "version" = 1, "isLatest" = true, "rootVersionId" = id WHERE "rootVersionId" IS NULL', v_workspace_schema);

  -- 7. INDEX: enforce unique version per group (distribuidorId + anio + trimestre)
  EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS idx_performance_group_version ON %I._performance ("distribuidorId", "anio", "trimestre", "version")', v_workspace_schema);

  -- 8. INDEX: only one latest per group
  EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS idx_performance_group_latest ON %I._performance ("distribuidorId", "anio", "trimestre") WHERE "isLatest" = true', v_workspace_schema);

  -- 9. Add Versions tab to the Performance page layout
  v_tab_id := gen_random_uuid();
  v_widget_id := gen_random_uuid();

  INSERT INTO core."pageLayoutTab" (id, title, "workspaceId", position, "pageLayoutId", "universalIdentifier", "applicationId", icon, "layoutMode", "isActive")
  VALUES (v_tab_id, 'Versions', v_workspace_id, 60, v_page_layout_id, gen_random_uuid(), v_app_id, 'IconHistory', 'CANVAS', true);

  INSERT INTO core."pageLayoutWidget" (id, "pageLayoutTabId", "workspaceId", title, type, "objectMetadataId", "gridPosition", "configuration", "universalIdentifier", "applicationId", position)
  VALUES (v_widget_id, v_tab_id, v_workspace_id, 'Versions', 'VERSIONS', v_object_id,
    '{"row": 0, "column": 0, "rowSpan": 12, "columnSpan": 12}'::jsonb,
    '{"configurationType": "VERSIONS"}'::jsonb,
    gen_random_uuid(), v_app_id,
    '{"layoutMode": "CANVAS"}'::jsonb);

  -- 10. Update the pageLayout tabIds array
  UPDATE core."pageLayout"
  SET "tabIds" = array_append("tabIds", v_tab_id)
  WHERE id = v_page_layout_id;

END $$;
