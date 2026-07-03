DO $$
DECLARE
  v_workspace_id uuid := '24fdc2a1-854b-4cbd-bee7-f879aa5b491e';
  v_object_id uuid := 'c30f65b1-4800-4ed5-895f-97aca04537a6';
  v_app_id uuid := '2ffb247f-35e3-46a6-a9a4-23ed3ffdc952';
BEGIN

  -- 1. Trimestre (SELECT: Q1/Q2/Q3/Q4/Anual)
  INSERT INTO core."fieldMetadata" (id, "universalIdentifier", "objectMetadataId", type, name, label, icon, "isActive", "isSystem", "isNullable", "isUIEditable", "isLabelSyncedWithName", "workspaceId", "applicationId", options)
  VALUES (gen_random_uuid(), gen_random_uuid(), v_object_id, 'SELECT', 'trimestre', 'Trimestre', 'IconCalendarStats', true, false, true, true, false, v_workspace_id, v_app_id,
    '[{"color":"blue","label":"Q1","value":"Q1","position":0},{"color":"green","label":"Q2","value":"Q2","position":1},{"color":"yellow","label":"Q3","value":"Q3","position":2},{"color":"red","label":"Q4","value":"Q4","position":3},{"color":"grey","label":"Anual","value":"ANUAL","position":4}]'::jsonb);

  -- 2. Año (NUMBER)
  INSERT INTO core."fieldMetadata" (id, "universalIdentifier", "objectMetadataId", type, name, label, icon, "isActive", "isSystem", "isNullable", "isUIEditable", "isLabelSyncedWithName", "workspaceId", "applicationId")
  VALUES (gen_random_uuid(), gen_random_uuid(), v_object_id, 'NUMBER', 'anio', 'Año', 'IconCalendar', true, false, true, true, false, v_workspace_id, v_app_id);

  -- 3. Estado (SELECT: Borrador/Completado/Revisado)
  INSERT INTO core."fieldMetadata" (id, "universalIdentifier", "objectMetadataId", type, name, label, icon, "isActive", "isSystem", "isNullable", "isUIEditable", "isLabelSyncedWithName", "workspaceId", "applicationId", options)
  VALUES (gen_random_uuid(), gen_random_uuid(), v_object_id, 'SELECT', 'estado', 'Estado', 'IconStatusChange', true, false, true, true, false, v_workspace_id, v_app_id,
    '[{"color":"yellow","label":"Borrador","value":"BORRADOR","position":0},{"color":"green","label":"Completado","value":"COMPLETADO","position":1},{"color":"blue","label":"Revisado","value":"REVISADO","position":2}]'::jsonb);

  -- 4. Datos Sell In (RAW_JSON)
  INSERT INTO core."fieldMetadata" (id, "universalIdentifier", "objectMetadataId", type, name, label, icon, "isActive", "isSystem", "isNullable", "isUIEditable", "isLabelSyncedWithName", "workspaceId", "applicationId")
  VALUES (gen_random_uuid(), gen_random_uuid(), v_object_id, 'RAW_JSON', 'datosSellIn', 'Datos Sell In', 'IconShoppingCart', true, false, true, true, false, v_workspace_id, v_app_id);

  -- 5. Datos Sell Out (RAW_JSON)
  INSERT INTO core."fieldMetadata" (id, "universalIdentifier", "objectMetadataId", type, name, label, icon, "isActive", "isSystem", "isNullable", "isUIEditable", "isLabelSyncedWithName", "workspaceId", "applicationId")
  VALUES (gen_random_uuid(), gen_random_uuid(), v_object_id, 'RAW_JSON', 'datosSellOut', 'Datos Sell Out', 'IconTruckDelivery', true, false, true, true, false, v_workspace_id, v_app_id);

  -- 6. Análisis Sell In (TEXT)
  INSERT INTO core."fieldMetadata" (id, "universalIdentifier", "objectMetadataId", type, name, label, icon, "isActive", "isSystem", "isNullable", "isUIEditable", "isLabelSyncedWithName", "workspaceId", "applicationId")
  VALUES (gen_random_uuid(), gen_random_uuid(), v_object_id, 'TEXT', 'analisisSellIn', 'Análisis Sell In', 'IconMessage', true, false, true, true, false, v_workspace_id, v_app_id);

  -- 7. Análisis Sell Out (TEXT)
  INSERT INTO core."fieldMetadata" (id, "universalIdentifier", "objectMetadataId", type, name, label, icon, "isActive", "isSystem", "isNullable", "isUIEditable", "isLabelSyncedWithName", "workspaceId", "applicationId")
  VALUES (gen_random_uuid(), gen_random_uuid(), v_object_id, 'TEXT', 'analisisSellOut', 'Análisis Sell Out', 'IconMessage', true, false, true, true, false, v_workspace_id, v_app_id);

  -- 8. Datos DN (RAW_JSON)
  INSERT INTO core."fieldMetadata" (id, "universalIdentifier", "objectMetadataId", type, name, label, icon, "isActive", "isSystem", "isNullable", "isUIEditable", "isLabelSyncedWithName", "workspaceId", "applicationId")
  VALUES (gen_random_uuid(), gen_random_uuid(), v_object_id, 'RAW_JSON', 'datosDn', 'Datos DN', 'IconMapPins', true, false, true, true, false, v_workspace_id, v_app_id);

  -- 9. Plan DN (TEXT)
  INSERT INTO core."fieldMetadata" (id, "universalIdentifier", "objectMetadataId", type, name, label, icon, "isActive", "isSystem", "isNullable", "isUIEditable", "isLabelSyncedWithName", "workspaceId", "applicationId")
  VALUES (gen_random_uuid(), gen_random_uuid(), v_object_id, 'TEXT', 'planDn', 'Plan DN', 'IconTargetArrow', true, false, true, true, false, v_workspace_id, v_app_id);

  -- 10. Datos Ratios Portfolio (RAW_JSON)
  INSERT INTO core."fieldMetadata" (id, "universalIdentifier", "objectMetadataId", type, name, label, icon, "isActive", "isSystem", "isNullable", "isUIEditable", "isLabelSyncedWithName", "workspaceId", "applicationId")
  VALUES (gen_random_uuid(), gen_random_uuid(), v_object_id, 'RAW_JSON', 'datosPortfolioRatios', 'Datos Ratios Portfolio', 'IconPizza', true, false, true, true, false, v_workspace_id, v_app_id);

  -- 11. Plan Portfolio (TEXT)
  INSERT INTO core."fieldMetadata" (id, "universalIdentifier", "objectMetadataId", type, name, label, icon, "isActive", "isSystem", "isNullable", "isUIEditable", "isLabelSyncedWithName", "workspaceId", "applicationId")
  VALUES (gen_random_uuid(), gen_random_uuid(), v_object_id, 'TEXT', 'planPortfolio', 'Plan Portfolio', 'IconTargetArrow', true, false, true, true, false, v_workspace_id, v_app_id);

  -- 12. Datos Carrusel / Exhibidores (RAW_JSON)
  INSERT INTO core."fieldMetadata" (id, "universalIdentifier", "objectMetadataId", type, name, label, icon, "isActive", "isSystem", "isNullable", "isUIEditable", "isLabelSyncedWithName", "workspaceId", "applicationId")
  VALUES (gen_random_uuid(), gen_random_uuid(), v_object_id, 'RAW_JSON', 'datosCarrusel', 'Datos Carrusel / Exhibidores', 'IconShelf', true, false, true, true, false, v_workspace_id, v_app_id);

  -- 13. Plan Carrusel (TEXT)
  INSERT INTO core."fieldMetadata" (id, "universalIdentifier", "objectMetadataId", type, name, label, icon, "isActive", "isSystem", "isNullable", "isUIEditable", "isLabelSyncedWithName", "workspaceId", "applicationId")
  VALUES (gen_random_uuid(), gen_random_uuid(), v_object_id, 'TEXT', 'planCarrusel', 'Plan Carrusel', 'IconTargetArrow', true, false, true, true, false, v_workspace_id, v_app_id);

  -- 14. Datos Turísticas (RAW_JSON)
  INSERT INTO core."fieldMetadata" (id, "universalIdentifier", "objectMetadataId", type, name, label, icon, "isActive", "isSystem", "isNullable", "isUIEditable", "isLabelSyncedWithName", "workspaceId", "applicationId")
  VALUES (gen_random_uuid(), gen_random_uuid(), v_object_id, 'RAW_JSON', 'datosTuristicas', 'Datos Turísticas', 'IconPlane', true, false, true, true, false, v_workspace_id, v_app_id);

  -- 15. Plan Turísticas (TEXT)
  INSERT INTO core."fieldMetadata" (id, "universalIdentifier", "objectMetadataId", type, name, label, icon, "isActive", "isSystem", "isNullable", "isUIEditable", "isLabelSyncedWithName", "workspaceId", "applicationId")
  VALUES (gen_random_uuid(), gen_random_uuid(), v_object_id, 'TEXT', 'planTuristicas', 'Plan Turísticas', 'IconTargetArrow', true, false, true, true, false, v_workspace_id, v_app_id);

  -- 16. Datos Licencias (RAW_JSON)
  INSERT INTO core."fieldMetadata" (id, "universalIdentifier", "objectMetadataId", type, name, label, icon, "isActive", "isSystem", "isNullable", "isUIEditable", "isLabelSyncedWithName", "workspaceId", "applicationId")
  VALUES (gen_random_uuid(), gen_random_uuid(), v_object_id, 'RAW_JSON', 'datosLicencias', 'Datos Licencias', 'IconLicense', true, false, true, true, false, v_workspace_id, v_app_id);

  -- 17. Plan Licencias (TEXT)
  INSERT INTO core."fieldMetadata" (id, "universalIdentifier", "objectMetadataId", type, name, label, icon, "isActive", "isSystem", "isNullable", "isUIEditable", "isLabelSyncedWithName", "workspaceId", "applicationId")
  VALUES (gen_random_uuid(), gen_random_uuid(), v_object_id, 'TEXT', 'planLicencias', 'Plan Licencias', 'IconTargetArrow', true, false, true, true, false, v_workspace_id, v_app_id);

  -- 18. Datos Canal Organizado (RAW_JSON)
  INSERT INTO core."fieldMetadata" (id, "universalIdentifier", "objectMetadataId", type, name, label, icon, "isActive", "isSystem", "isNullable", "isUIEditable", "isLabelSyncedWithName", "workspaceId", "applicationId")
  VALUES (gen_random_uuid(), gen_random_uuid(), v_object_id, 'RAW_JSON', 'datosCanalOrganizado', 'Datos Canal Organizado', 'IconBuildingStore', true, false, true, true, false, v_workspace_id, v_app_id);

  -- 19. Plan Canal Organizado (TEXT)
  INSERT INTO core."fieldMetadata" (id, "universalIdentifier", "objectMetadataId", type, name, label, icon, "isActive", "isSystem", "isNullable", "isUIEditable", "isLabelSyncedWithName", "workspaceId", "applicationId")
  VALUES (gen_random_uuid(), gen_random_uuid(), v_object_id, 'TEXT', 'planCanalOrganizado', 'Plan Canal Organizado', 'IconTargetArrow', true, false, true, true, false, v_workspace_id, v_app_id);

  -- 20. Estructura de Precios (RAW_JSON)
  INSERT INTO core."fieldMetadata" (id, "universalIdentifier", "objectMetadataId", type, name, label, icon, "isActive", "isSystem", "isNullable", "isUIEditable", "isLabelSyncedWithName", "workspaceId", "applicationId")
  VALUES (gen_random_uuid(), gen_random_uuid(), v_object_id, 'RAW_JSON', 'estructuraPrecios', 'Estructura de Precios', 'IconCoin', true, false, true, true, false, v_workspace_id, v_app_id);

  -- 21. Plan Promocional (RAW_JSON)
  INSERT INTO core."fieldMetadata" (id, "universalIdentifier", "objectMetadataId", type, name, label, icon, "isActive", "isSystem", "isNullable", "isUIEditable", "isLabelSyncedWithName", "workspaceId", "applicationId")
  VALUES (gen_random_uuid(), gen_random_uuid(), v_object_id, 'RAW_JSON', 'planPromocional', 'Plan Promocional', 'IconDiscount', true, false, true, true, false, v_workspace_id, v_app_id);

END $$;
