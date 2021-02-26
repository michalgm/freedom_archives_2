import {useDebouncedCallback} from 'use-debounce';
import {useEffect} from 'react';
import {useFormikContext} from 'formik';

export default function AutoSave({timeout = 300}) {
    const formik = useFormikContext()
    const {submitForm, values, isValid, dirty, isSubmitting} = formik;
    const {callback: debouncedSubmitCaller} = useDebouncedCallback((submitForm) => {
        submitForm();
    }, timeout)

    useEffect(() => {
        if (isValid && dirty && !isSubmitting) {
            debouncedSubmitCaller(submitForm);
        }
    }, [debouncedSubmitCaller, submitForm, isValid, dirty, isSubmitting, values]);

    return null;
}