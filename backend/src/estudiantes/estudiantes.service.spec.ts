import { EstudiantesService } from './estudiantes.service';

/**
 * PU-2 | Capa: Service (lógica de negocio)
 * Escenario: un ADMIN consulta la página 2 (limit 20) de estudiantes.
 */
describe('EstudiantesService (unitaria)', () => {
  it('ADMIN: pagina, calcula totales y filtra matrículas no activas', async () => {
    const estudiante = {
      id: '7',
      codigoEstudiante: 'EST-007',
      estado: 'ACTIVO',
      fechaIngreso: new Date('2026-02-01'),
      persona: {
        id: '70',
        nombres: 'Ada',
        apellidos: 'Lovelace',
        email: 'ada@aero.edu',
        documento: '1001',
        estado: 'ACTIVA',
      },
      matriculas: [
        { estado: 'ACTIVA', grupo: { id: '5', codigo: 'G-05', nombre: 'Cálculo A' } },
        { estado: 'RETIRADA', grupo: { id: '6', codigo: 'G-06', nombre: 'Física B' } },
      ],
    };

    const estudianteRepo = {
      findAndCount: jest.fn().mockResolvedValue([[estudiante], 45]),
    };
    const service = new EstudiantesService(
      estudianteRepo as any,
      {} as any,
      {} as any,
      {} as any,
    );

    const resultado = await service.findAll({ rol: { codigo: 'ADMIN' } }, 2, 20);

    expect(estudianteRepo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 20 }),
    );
    expect(resultado).toMatchObject({
      total: 45,
      pagina: 2,
      porPagina: 20,
      totalPaginas: 3,
    });
    const [primero] = (resultado as any).estudiantes;
    expect(primero.id).toBe(7);
    expect(primero.persona.nombreCompleto).toBe('Ada Lovelace');
    expect(primero.grupos).toEqual([{ id: 5, codigo: 'G-05', nombre: 'Cálculo A' }]);
  });
});
