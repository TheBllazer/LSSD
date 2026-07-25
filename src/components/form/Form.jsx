import { FormProvider, useForm } from 'react-hook-form';
import { Box, Stack } from '@mui/material';
import { zodResolver } from '@/utils/validation';

/**
 * Enveloppe de formulaire.
 *
 * Branche React Hook Form sur un schéma zod et diffuse le contexte aux champs.
 * Le même schéma sert à la validation du service : un formulaire ne peut pas
 * accepter une valeur que l'écriture refuserait.
 *
 * @param {object} props
 * @param {import('zod').ZodType} props.schema
 * @param {object} props.defaultValues
 * @param {(values: object) => void | Promise<void>} props.onSubmit
 * @param {(methods: import('react-hook-form').UseFormReturn) => React.ReactNode | React.ReactNode} props.children
 * @param {'onSubmit'|'onBlur'|'onChange'} [props.mode='onBlur']
 * @param {object} [props.sx]
 *
 * @example
 * <Form schema={citizenSchema} defaultValues={citizen} onSubmit={save}>
 *   <TextField name="lastName" label="Nom" />
 * </Form>
 */
export default function Form({
  schema,
  defaultValues,
  onSubmit,
  children,
  mode = 'onBlur',
  sx,
  ...rest
}) {
  const methods = useForm({
    defaultValues,
    resolver: schema ? zodResolver(schema) : undefined,
    mode,
  });

  return (
    <FormProvider {...methods}>
      <Box
        component="form"
        noValidate
        onSubmit={methods.handleSubmit(onSubmit)}
        sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, ...sx }}
        {...rest}
      >
        {typeof children === 'function' ? children(methods) : children}
      </Box>
    </FormProvider>
  );
}

/**
 * Rangée de champs alignés horizontalement.
 * @param {{ children: React.ReactNode, spacing?: number }} props
 */
export function FormRow({ children, spacing = 1.5 }) {
  return (
    <Stack direction="row" spacing={spacing} sx={{ mb: 1.5, alignItems: 'flex-start' }}>
      {children}
    </Stack>
  );
}

/**
 * Zone d'actions du formulaire, alignée à droite.
 * @param {{ children: React.ReactNode }} props
 */
export function FormActions({ children }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      justifyContent="flex-end"
      sx={{
        pt: 1.5,
        mt: 1,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      {children}
    </Stack>
  );
}
