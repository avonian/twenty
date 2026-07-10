import { Module } from '@nestjs/common';

import { WorkspaceDataSourceModule } from 'src/engine/workspace-datasource/workspace-datasource.module';
import { PaisUltimoEventoListener } from 'src/modules/flamagas-derived-fields/listeners/pais-ultimo-evento.listener';

// Flamagas orange-field auto-fetch: derives fields that mirror data owned by a
// related object (e.g. pais.ultimoEvento from eventos). One listener per
// derivation; add more here as the "fetch from other tables" system grows.
@Module({
  imports: [WorkspaceDataSourceModule],
  providers: [PaisUltimoEventoListener],
})
export class FlamagasDerivedFieldsModule {}
