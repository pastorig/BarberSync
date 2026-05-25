# AGENTS.md

## Reglas generales del proyecto

Este proyecto es un SaaS de turnos para barberias. SV Barber es solo el primer cliente/demo y no debe condicionar la arquitectura general.

- Usar TypeScript en todo el codigo.
- Usar Next.js con App Router.
- Usar Tailwind CSS para estilos.
- Mantener la estructura `src/` limpia y predecible.
- Crear componentes reutilizables cuando una pieza de UI pueda repetirse.
- Evitar hardcodear logica especifica de SV Barber.
- Pensar siempre en un modelo multi-barberia.
- Mantener el codigo escalable, claro y facil de modificar.
- Separar UI, logica de negocio y datos.
- Evitar duplicacion de codigo.
- Priorizar claridad, mantenimiento y buenas practicas por encima de soluciones rapidas.
- No agregar dependencias innecesarias.
- No implementar integraciones hasta que esten definidas en una fase concreta.

## Arquitectura esperada

- La UI debe vivir en componentes pequenos y enfocados.
- La logica de negocio debe estar separada de los componentes visuales.
- Los datos demo deben poder reemplazarse luego por datos de base de datos sin reescribir la interfaz.
- Cualquier referencia a servicios, precios, horarios, barberos o datos de contacto debe modelarse pensando en multiples barberias.
- Las futuras integraciones externas deben aislarse en modulos propios cuando sean implementadas.
- Evitar mezclar reglas de reserva, renderizado y persistencia en un mismo archivo.

## Reglas de diseno

- El diseno debe ser responsive de forma obligatoria.
- La implementacion debe ser mobile-first.
- Debe funcionar correctamente en celular, tablet, notebook y PC.
- Los botones deben ser grandes, claros y comodos para uso tactil.
- Los formularios futuros deben estar optimizados para movil.
- El estilo visual debe sentirse moderno, minimalista y premium.
- La estetica debe alinearse con barberias modernas: sobria, elegante, directa y confiable.
- Evitar interfaces recargadas, textos innecesarios o patrones visuales genericos.
- Mantener buena legibilidad, contraste y jerarquia visual.

## Restricciones actuales

Por ahora no implementar:

- Supabase.
- WhatsApp.
- Google Calendar.
- Autenticacion.
- Panel admin funcional.
- Pagos online.
- Integraciones externas.

La fase actual se limita a documentacion, arquitectura base y preparacion para futuras etapas.

## Criterios antes de finalizar cambios

- Verificar que el proyecto compile correctamente.
- Ejecutar lint cuando haya cambios de codigo.
- No modificar funcionalidades existentes si la tarea solo pide documentacion.
- Mantener los cambios acotados al objetivo solicitado.
